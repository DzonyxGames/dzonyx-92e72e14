"use client";

import Link from "next/link";
import { useAuth } from "@clerk/react";
import {
  BookPlus,
  CheckCircle2,
  FileImage,
  ImagePlus,
  Loader2,
  LockKeyhole,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { authenticatedFetch, responseMessage } from "@/lib/auth-fetch";
import {
  formatMoney,
  type ComicRecord,
  type StoreSettings,
} from "@/lib/types";

type IssueForm = {
  title: string;
  collectionName: string;
  issueNumber: string;
  description: string;
  priceEur: string;
  priceUsd: string;
  includedInPass: boolean;
  status: "draft" | "published";
};

type PageAsset = { id: string; position: number };

const blankIssue: IssueForm = {
  title: "",
  collectionName: "",
  issueNumber: "1",
  description: "",
  priceEur: "0.50",
  priceUsd: "0.50",
  includedInPass: true,
  status: "draft",
};

function toCents(value: string) {
  const amount = Number(value.replace(",", "."));
  if (!Number.isFinite(amount) || amount < 0) return Number.NaN;
  return Math.round(amount * 100);
}

function issuePayload(form: IssueForm) {
  return {
    title: form.title,
    collectionName: form.collectionName,
    issueNumber: Number(form.issueNumber),
    description: form.description,
    priceEurCents: toCents(form.priceEur),
    priceUsdCents: toCents(form.priceUsd),
    includedInPass: form.includedInPass,
    status: form.status,
  };
}

function formFromComic(comic: ComicRecord): IssueForm {
  return {
    title: comic.title,
    collectionName: comic.collectionName,
    issueNumber: String(comic.issueNumber),
    description: comic.description,
    priceEur: (comic.priceEurCents / 100).toFixed(2),
    priceUsd: (comic.priceUsdCents / 100).toFixed(2),
    includedInPass: comic.includedInPass,
    status: comic.status,
  };
}

function IssueFields({
  form,
  setForm,
  allowPublishing,
}: {
  form: IssueForm;
  setForm: (value: IssueForm) => void;
  allowPublishing: boolean;
}) {
  function patch<K extends keyof IssueForm>(key: K, value: IssueForm[K]) {
    setForm({ ...form, [key]: value });
  }
  return (
    <div className="admin-form-grid">
      <label className="admin-field full">
        <span>Issue title</span>
        <Input
          value={form.title}
          onChange={(event) => patch("title", event.target.value)}
          placeholder="Your issue title"
          maxLength={120}
          required
        />
      </label>
      <label className="admin-field">
        <span>Collection</span>
        <Input
          value={form.collectionName}
          onChange={(event) => patch("collectionName", event.target.value)}
          placeholder="Collection name"
          maxLength={120}
          required
        />
      </label>
      <label className="admin-field">
        <span>Issue number</span>
        <Input
          type="number"
          value={form.issueNumber}
          onChange={(event) => patch("issueNumber", event.target.value)}
          min={1}
          max={999}
          required
        />
      </label>
      <label className="admin-field full">
        <span>Description</span>
        <Textarea
          value={form.description}
          onChange={(event) => patch("description", event.target.value)}
          placeholder="Short description shown in the catalogue"
          maxLength={1000}
          rows={5}
        />
      </label>
      <label className="admin-field">
        <span>EUR price</span>
        <Input
          inputMode="decimal"
          value={form.priceEur}
          onChange={(event) => patch("priceEur", event.target.value)}
          placeholder="0.50"
          required
        />
      </label>
      <label className="admin-field">
        <span>USD price</span>
        <Input
          inputMode="decimal"
          value={form.priceUsd}
          onChange={(event) => patch("priceUsd", event.target.value)}
          placeholder="0.50"
          required
        />
      </label>
      <div className="admin-toggle full">
        <div>
          <strong>Include in Universe Pass</strong>
          <span>Members can read this issue while their pass is active.</span>
        </div>
        <Switch
          checked={form.includedInPass}
          onCheckedChange={(checked) => patch("includedInPass", checked)}
          aria-label="Include in Universe Pass"
        />
      </div>
      {allowPublishing ? (
        <div className="admin-toggle full">
          <div>
            <strong>Published</strong>
            <span>Only publish after adding a cover and at least one page.</span>
          </div>
          <Switch
            checked={form.status === "published"}
            onCheckedChange={(checked) =>
              patch("status", checked ? "published" : "draft")
            }
            aria-label="Published"
          />
        </div>
      ) : null}
      <p className="admin-form-note full">
        Set both prices to 0 for a free issue. Payments remain disabled until a
        real payment provider is connected.
      </p>
    </div>
  );
}

export function AdminDashboard() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [checked, setChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [comics, setComics] = useState<ComicRecord[]>([]);
  const [storageError, setStorageError] = useState("");
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<IssueForm>(blankIssue);
  const [selected, setSelected] = useState<ComicRecord | null>(null);
  const [editForm, setEditForm] = useState<IssueForm>(blankIssue);
  const [pages, setPages] = useState<PageAsset[]>([]);
  const [passForm, setPassForm] = useState({
    passName: "Dzonyx Universe Pass",
    priceEur: "2.00",
    priceUsd: "2.50",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [uploadLabel, setUploadLabel] = useState("");

  const loadComics = useCallback(async () => {
    const response = await authenticatedFetch(getToken, "/api/admin/comics");
    if (!response.ok) {
      const message = await responseMessage(response);
      if (response.status === 503) setStorageError(message);
      throw new Error(message);
    }
    const data = (await response.json()) as { comics: ComicRecord[] };
    setComics(data.comics);
    setStorageError("");
  }, [getToken]);

  const loadPages = useCallback(
    async (comicId: string) => {
      const response = await authenticatedFetch(
        getToken,
        "/api/admin/comics/" + comicId + "/pages",
      );
      if (!response.ok) throw new Error(await responseMessage(response));
      const data = (await response.json()) as { pages: PageAsset[] };
      setPages(data.pages);
    },
    [getToken],
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    Promise.all([
      authenticatedFetch(getToken, "/api/me").then((response) =>
        response.json() as Promise<{ isAdmin?: boolean }>,
      ),
      fetch("/api/store").then((response) =>
        response.json() as Promise<{ settings?: StoreSettings }>,
      ),
    ])
      .then(([me, store]) => {
        setIsAdmin(Boolean(me.isAdmin));
        if (store.settings) {
          setPassForm({
            passName: store.settings.passName,
            priceEur: (store.settings.passEurCents / 100).toFixed(2),
            priceUsd: (store.settings.passUsdCents / 100).toFixed(2),
          });
        }
        if (me.isAdmin) return loadComics();
      })
      .catch((error: Error) => setStorageError(error.message))
      .finally(() => setChecked(true));
  }, [getToken, isLoaded, isSignedIn, loadComics]);

  const publishedCount = useMemo(
    () => comics.filter((comic) => comic.status === "published").length,
    [comics],
  );

  async function createIssue(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await authenticatedFetch(
        getToken,
        "/api/admin/comics",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(issuePayload(createForm)),
        },
      );
      if (!response.ok) throw new Error(await responseMessage(response));
      toast.success("Draft issue created.");
      setCreateOpen(false);
      setCreateForm(blankIssue);
      await loadComics();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create issue.");
    } finally {
      setBusy(false);
    }
  }

  function openIssue(comic: ComicRecord) {
    setEditForm(formFromComic(comic));
    setPages([]);
    setSelected(comic);
    loadPages(comic.id).catch((error: Error) => toast.error(error.message));
  }

  async function saveIssue(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const response = await authenticatedFetch(
        getToken,
        "/api/admin/comics/" + selected.id,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(issuePayload(editForm)),
        },
      );
      if (!response.ok) throw new Error(await responseMessage(response));
      toast.success("Issue saved.");
      await loadComics();
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save issue.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadCover(file: File) {
    if (!selected) return;
    setUploadLabel("Uploading cover");
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await authenticatedFetch(
        getToken,
        "/api/admin/comics/" + selected.id + "/cover",
        { method: "POST", body: formData },
      );
      if (!response.ok) throw new Error(await responseMessage(response));
      toast.success("Cover uploaded.");
      await loadComics();
      const updated = comics.find((comic) => comic.id === selected.id);
      if (updated) setSelected({ ...updated, coverAssetId: "uploaded" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cover upload failed.");
    } finally {
      setUploadLabel("");
    }
  }

  async function uploadPages(files: File[]) {
    if (!selected || !files.length) return;
    try {
      for (let index = 0; index < files.length; index += 1) {
        setUploadLabel(
          "Uploading page " + (index + 1) + " of " + files.length,
        );
        const formData = new FormData();
        formData.set("file", files[index]);
        const response = await authenticatedFetch(
          getToken,
          "/api/admin/comics/" + selected.id + "/pages",
          { method: "POST", body: formData },
        );
        if (!response.ok) throw new Error(await responseMessage(response));
      }
      toast.success(files.length + " page(s) uploaded.");
      await Promise.all([loadPages(selected.id), loadComics()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Page upload failed.");
    } finally {
      setUploadLabel("");
    }
  }

  async function deletePage(assetId: string) {
    const response = await authenticatedFetch(
      getToken,
      "/api/admin/assets/" + assetId,
      { method: "DELETE" },
    );
    if (!response.ok) {
      toast.error(await responseMessage(response));
      return;
    }
    toast.success("Page removed.");
    if (selected) {
      await Promise.all([loadPages(selected.id), loadComics()]);
    }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    setSettingsSaving(true);
    try {
      const response = await authenticatedFetch(
        getToken,
        "/api/admin/settings",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passName: passForm.passName,
            passEurCents: toCents(passForm.priceEur),
            passUsdCents: toCents(passForm.priceUsd),
          }),
        },
      );
      if (!response.ok) throw new Error(await responseMessage(response));
      toast.success("Pass settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setSettingsSaving(false);
    }
  }

  if (!isLoaded) {
    return <Skeleton className="h-[520px] w-full" />;
  }

  if (!isSignedIn) {
    return (
      <div className="admin-denied">
        <LockKeyhole />
        <h2>Administrator sign-in required</h2>
        <p>Sign in with the pre-created administrator email account.</p>
        <Button asChild>
          <Link href="/sign-in">Sign in with email code</Link>
        </Button>
      </div>
    );
  }

  if (!checked) {
    return <Skeleton className="h-[520px] w-full" />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <LockKeyhole />
        <h2>Access denied</h2>
        <p>This page is only available to the Dzonyx administrator.</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-summary">
        <div>
          <span>Total issues</span>
          <strong>{comics.length}</strong>
        </div>
        <div>
          <span>Published</span>
          <strong>{publishedCount}</strong>
        </div>
        <div>
          <span>Drafts</span>
          <strong>{comics.length - publishedCount}</strong>
        </div>
        <div className="payment-status">
          <span>Payments</span>
          <strong>OFF</strong>
        </div>
      </div>

      {storageError ? (
        <div className="admin-storage-warning">
          <strong>Storage connection needed</strong>
          <p>{storageError}</p>
        </div>
      ) : null}

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow plain">Catalogue management</p>
            <h2>ISSUES</h2>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus />
                New issue
              </Button>
            </DialogTrigger>
            <DialogContent className="admin-dialog max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <form onSubmit={createIssue}>
                <DialogHeader>
                  <DialogTitle>Create draft issue</DialogTitle>
                  <DialogDescription>
                    Add the details first, then upload the cover and pages.
                  </DialogDescription>
                </DialogHeader>
                <IssueFields
                  form={createForm}
                  setForm={setCreateForm}
                  allowPublishing={false}
                />
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={busy}>
                    {busy ? <Loader2 className="animate-spin" /> : <BookPlus />}
                    Create draft
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {!comics.length ? (
          <div className="admin-empty">
            <FileImage />
            <strong>No issues yet</strong>
            <span>Create the first draft when your comic is ready.</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Prices</TableHead>
                <TableHead>Pass</TableHead>
                <TableHead className="text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comics.map((comic) => (
                <TableRow key={comic.id}>
                  <TableCell>
                    <div className="admin-issue-name">
                      <strong>{comic.title}</strong>
                      <span>
                        {comic.collectionName} · #{comic.issueNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        comic.status === "published" ? "default" : "outline"
                      }
                    >
                      {comic.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{comic.pageCount}</TableCell>
                  <TableCell>
                    {formatMoney(comic.priceEurCents, "EUR")} /{" "}
                    {formatMoney(comic.priceUsdCents, "USD")}
                  </TableCell>
                  <TableCell>{comic.includedInPass ? "Included" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openIssue(comic)}
                    >
                      <Pencil />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow plain">Membership settings</p>
            <h2>UNIVERSE PASS</h2>
          </div>
        </div>
        <form className="settings-form" onSubmit={saveSettings}>
          <label className="admin-field">
            <span>Public name</span>
            <Input
              value={passForm.passName}
              onChange={(event) =>
                setPassForm({ ...passForm, passName: event.target.value })
              }
            />
          </label>
          <label className="admin-field">
            <span>EUR monthly price</span>
            <Input
              value={passForm.priceEur}
              onChange={(event) =>
                setPassForm({ ...passForm, priceEur: event.target.value })
              }
            />
          </label>
          <label className="admin-field">
            <span>USD monthly price</span>
            <Input
              value={passForm.priceUsd}
              onChange={(event) =>
                setPassForm({ ...passForm, priceUsd: event.target.value })
              }
            />
          </label>
          <Button type="submit" disabled={settingsSaving}>
            {settingsSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            Save settings
          </Button>
        </form>
      </section>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="admin-sheet overflow-y-auto sm:max-w-xl">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>Edit issue</SheetTitle>
                <SheetDescription>
                  Update details, upload files and choose when to publish.
                </SheetDescription>
              </SheetHeader>
              <form onSubmit={saveIssue} className="admin-sheet-form">
                <IssueFields
                  form={editForm}
                  setForm={setEditForm}
                  allowPublishing
                />
                <div className="upload-panel">
                  <div>
                    <strong>Cover image</strong>
                    <span>JPG, PNG or WebP · maximum 8 MB</span>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <label>
                      <ImagePlus />
                      {selected.coverAssetId ? "Replace cover" : "Upload cover"}
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadCover(file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </Button>
                </div>
                <div className="upload-panel page-upload">
                  <div>
                    <strong>Comic pages</strong>
                    <span>
                      Select pages in reading order · {pages.length} uploaded
                    </span>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <label>
                      <Plus />
                      Add pages
                      <input
                        className="sr-only"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const files = Array.from(event.target.files ?? []);
                          void uploadPages(files);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </Button>
                </div>
                {uploadLabel ? (
                  <div className="upload-progress">
                    <Loader2 className="animate-spin" />
                    {uploadLabel}
                  </div>
                ) : null}
                {pages.length ? (
                  <div className="page-list">
                    {pages.map((page) => (
                      <div key={page.id}>
                        <span>Page {page.position}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={"Remove page " + page.position}
                            >
                              <Trash2 />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove page {page.position}?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes the uploaded image from the issue.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => void deletePage(page.id)}
                              >
                                Remove page
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                ) : null}
                <Button type="submit" disabled={busy || Boolean(uploadLabel)}>
                  {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                  Save issue
                </Button>
              </form>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
