import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';
import AdminGames from '@/components/admin/AdminGames';
import AdminNews from '@/components/admin/AdminNews';
import AdminSocials from '@/components/admin/AdminSocials';
import AdminUsers from '@/components/admin/AdminUsers';

const Admin = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen pt-24 px-4 max-w-6xl mx-auto pb-20">
      <h1 className="text-4xl font-bold text-center mb-8 horror-glow" style={{ fontFamily: 'Creepster, cursive' }}>
        <Shield className="inline w-10 h-10 mr-2" /> Admin Panel
      </h1>

      <Tabs defaultValue="games" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="socials">Socials</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="games"><AdminGames /></TabsContent>
        <TabsContent value="news"><AdminNews /></TabsContent>
        <TabsContent value="socials"><AdminSocials /></TabsContent>
        <TabsContent value="users"><AdminUsers /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
