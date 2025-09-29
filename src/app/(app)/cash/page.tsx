
'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/lib/data-context';
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/dashboard/stat-card";
import { AddEntitySheet } from '@/components/app/products/add-entity-sheet';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Banknote, Landmark, Wallet, MoreHorizontal } from 'lucide-react';
import type { CashAccount, CashTransaction } from '@/lib/types';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const addAccountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  type: z.enum(['cash', 'bank']),
  balance: z.coerce.number(),
});

const cashTransactionSchema = z.object({
  accountId: z.string(),
  type: z.enum(['deposit', 'withdrawal', 'adjustment']),
  amount: z.coerce.number().positive("Amount must be positive."),
  description: z.string().min(2, "Description must be at least 2 characters."),
});

function AddAccountForm({ onSave, onSuccess }: { onSave: (data: Omit<CashAccount, 'id'>) => Promise<void>, onSuccess: () => void }) {
  const form = useForm({ resolver: zodResolver(addAccountSchema), defaultValues: { name: '', type: 'cash' as 'cash' | 'bank', balance: 0 } });
  const { toast } = useToast();

  async function onSubmit(data: z.infer<typeof addAccountSchema>) {
    await onSave(data);
    toast({ title: 'Account Added', description: `${data.name} has been successfully added.` });
    form.reset();
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Account Name</FormLabel><FormControl><Input {...field} placeholder="e.g., Cash Drawer" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem><FormLabel>Account Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select account type" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="balance" render={({ field }) => (
          <FormItem><FormLabel>Starting Balance</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit">Add Account</Button>
      </form>
    </Form>
  );
}

function AdjustBalanceForm({ account, onSave, onSuccess }: { account: CashAccount, onSave: (data: Omit<CashTransaction, 'id'|'date'>) => Promise<void>, onSuccess: () => void }) {
  const form = useForm({
    resolver: zodResolver(cashTransactionSchema),
    defaultValues: { accountId: account.id, type: 'adjustment' as 'deposit' | 'withdrawal' | 'adjustment', amount: account.balance, description: 'Initial balance adjustment' }
  });
  const { toast } = useToast();

  async function onSubmit(data: z.infer<typeof cashTransactionSchema>) {
    await onSave(data);
    toast({ title: 'Balance Adjusted', description: `Balance for ${account.name} has been updated.` });
    onSuccess();
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem><FormLabel>Transaction Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                <SelectItem value="adjustment">Set Balance To</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <DialogFooter>
          <Button type="submit">Save Transaction</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


export default function CashPage() {
  const { cashAccounts, cashTransactions, addCashAccount, addCashTransaction, deleteCashAccount, loading } = useData();
  const [adjustingAccount, setAdjustingAccount] = useState<CashAccount | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CashAccount | null>(null);
  const { toast } = useToast();

  const { totalCash, totalBank } = useMemo(() => {
    return cashAccounts.reduce((acc, account) => {
      if (account.type === 'cash') {
        acc.totalCash += account.balance;
      } else {
        acc.totalBank += account.balance;
      }
      return acc;
    }, { totalCash: 0, totalBank: 0 });
  }, [cashAccounts]);

  const sortedTransactions = useMemo(() => {
    return [...cashTransactions].sort((a,b) => (b.date as Date).getTime() - (a.date as Date).getTime());
  }, [cashTransactions]);
  
  const handleDelete = async () => {
    if (deleteCandidate) {
      await deleteCashAccount(deleteCandidate.id);
      toast({ title: 'Account Deleted', description: `${deleteCandidate.name} has been successfully deleted.` });
      setDeleteCandidate(null);
    }
  };

  return (
    <div>
      <PageHeader title="Cash Accounts">
         <AddEntitySheet buttonText="Add Account" title="Add a new cash/bank account" description="Enter the details for the new account.">
            {(onSuccess) => <AddAccountForm onSave={addCashAccount} onSuccess={onSuccess} />}
          </AddEntitySheet>
      </PageHeader>
      
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <StatCard 
          title="Total In Hand"
          value={`MMK ${totalCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Wallet}
          description="Total cash across all cash accounts."
          loading={loading}
          className="bg-shiny-purple rounded-xl shadow-lg"
        />
        <StatCard 
          title="Total in Bank"
          value={`MMK ${totalBank.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Landmark}
          description="Total cash across all bank accounts."
          loading={loading}
          className="bg-shiny-red rounded-xl shadow-lg"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
            <h2 className="text-xl font-semibold mb-4">Accounts</h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell className="capitalize">{account.type}</TableCell>
                      <TableCell className="text-right">MMK {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                       <TableCell>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setAdjustingAccount(account)}>
                                      Adjust Balance
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteCandidate(account)}>
                                      Delete
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {cashAccounts.length === 0 && (
                      <TableRow>
                          <TableCell colSpan={4} className="text-center h-24">
                              No cash accounts found.
                          </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
        </div>
        <div>
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
             <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedTransactions.slice(0, 10).map((tx) => {
                            const account = cashAccounts.find(a => a.id === tx.accountId);
                            const isNegative = tx.type === 'withdrawal';
                            return (
                                <TableRow key={tx.id}>
                                    <TableCell>{format(tx.date as Date, 'PP')}</TableCell>
                                    <TableCell>{account?.name}</TableCell>
                                    <TableCell>{tx.description}</TableCell>
                                    <TableCell className={`text-right ${isNegative ? 'text-destructive' : ''}`}>
                                        {isNegative ? '-' : ''}MMK {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {sortedTransactions.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={4} className="text-center h-24">
                                  No transactions found.
                              </TableCell>
                          </TableRow>
                      )}
                    </TableBody>
                </Table>
            </div>
        </div>
      </div>
      <Dialog open={!!adjustingAccount} onOpenChange={() => setAdjustingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Balance for {adjustingAccount?.name}</DialogTitle>
            <DialogDescription>Record a deposit, withdrawal, or set a new balance.</DialogDescription>
          </DialogHeader>
          {adjustingAccount && (
            <AdjustBalanceForm 
              account={adjustingAccount}
              onSave={addCashTransaction}
              onSuccess={() => setAdjustingAccount(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the account <strong>{deleteCandidate?.name}</strong> and all of its associated transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
