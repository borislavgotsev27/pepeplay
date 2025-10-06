import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Wallet, Package, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { toast } from "sonner";

const Admin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    totalTransactions: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      setUsers(profilesData || []);

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })
        .limit(50);

      setTransactions(transactionsData || []);

      // Fetch packages
      const { data: packagesData } = await supabase
        .from('packages')
        .select('*')
        .order('sort_order');

      setPackages(packagesData || []);

      // Calculate stats
      const totalBalance = profilesData?.reduce((sum, u) => sum + Number(u.balance), 0) || 0;
      const totalEarnings = profilesData?.reduce((sum, u) => sum + Number(u.total_earnings), 0) || 0;

      setStats({
        totalUsers: profilesData?.length || 0,
        totalBalance,
        totalTransactions: transactionsData?.length || 0,
        totalEarnings
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const updateUserBalance = async (userId: string, newBalance: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success('Balance updated successfully');
      fetchAdminData();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Failed to update balance');
    }
  };

  const updateTransactionStatus = async (txId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', txId);

      if (error) throw error;
      
      toast.success(`Transaction ${status}`);
      fetchAdminData();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-muted-foreground">Manage users, transactions, and system settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Users"
            value={loading ? "..." : stats.totalUsers.toString()}
            icon={Users}
            variant="primary"
          />
          <StatsCard
            title="Total Balance"
            value={loading ? "..." : `$${stats.totalBalance.toFixed(2)}`}
            icon={Wallet}
            variant="gold"
          />
          <StatsCard
            title="Total Transactions"
            value={loading ? "..." : stats.totalTransactions.toString()}
            icon={Package}
          />
          <StatsCard
            title="Total Earnings"
            value={loading ? "..." : `$${stats.totalEarnings.toFixed(2)}`}
            icon={TrendingUp}
            variant="gold"
          />
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="p-6 gradient-card">
              <h2 className="text-2xl font-bold mb-4">User Management</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Total Earnings</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            defaultValue={user.balance}
                            className="w-32"
                            onBlur={(e) => {
                              const newBalance = parseFloat(e.target.value);
                              if (newBalance !== user.balance) {
                                updateUserBalance(user.id, newBalance);
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>${Number(user.total_earnings).toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-xs">{user.referral_code}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">View Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card className="p-6 gradient-card">
              <h2 className="text-2xl font-bold mb-4">Transaction Management</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{tx.profiles?.username || 'Unknown'}</TableCell>
                        <TableCell className="capitalize">{tx.type.replace('_', ' ')}</TableCell>
                        <TableCell>${Number(tx.amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={tx.status === 'completed' ? 'default' : tx.status === 'pending' ? 'secondary' : 'destructive'}>
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {tx.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => updateTransactionStatus(tx.id, 'completed')}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => updateTransactionStatus(tx.id, 'failed')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="space-y-4">
            <Card className="p-6 gradient-card">
              <h2 className="text-2xl font-bold mb-4">Package Management</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Bonus %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sort Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell>{pkg.name}</TableCell>
                        <TableCell>${Number(pkg.amount).toFixed(2)}</TableCell>
                        <TableCell>{pkg.bonus_percentage}%</TableCell>
                        <TableCell>
                          <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                            {pkg.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{pkg.sort_order}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
