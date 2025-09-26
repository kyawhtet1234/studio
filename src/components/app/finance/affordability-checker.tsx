
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { analyzeAffordability, type AffordabilityAnalysisOutput } from '@/ai/flows/affordability-analysis-flow';
import type { SaleTransaction, Expense, CashAccount } from '@/lib/types';
import { Loader2, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AffordabilityCheckerProps {
  sales: SaleTransaction[];
  expenses: Expense[];
  cashAccounts: CashAccount[];
}

export function AffordabilityChecker({ sales, expenses, cashAccounts }: AffordabilityCheckerProps) {
  const [newExpense, setNewExpense] = useState<number>(400000);
  const [analysisResult, setAnalysisResult] = useState<AffordabilityAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (newExpense <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a positive monthly expense amount.',
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const historicalSales = sales.map(s => ({ date: s.date.toISOString(), amount: s.total }));
      const historicalExpenses = expenses.map(e => ({ date: e.date.toISOString(), amount: e.amount }));
      const totalCashBalance = cashAccounts.reduce((sum, acc) => sum + acc.balance, 0);

      const result = await analyzeAffordability({
        historicalSales,
        historicalExpenses,
        currentCashBalance: totalCashBalance,
        newMonthlyExpense: newExpense,
        durationInMonths: 12,
      });

      setAnalysisResult(result);
    } catch (error) {
      console.error("Error analyzing affordability:", error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not generate the affordability analysis. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Affordability Checker</CardTitle>
        <CardDescription>Analyze if you can afford a new recurring monthly expense, like an employee's salary.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="new-expense">New Monthly Expense (MMK)</Label>
            <Input
              id="new-expense"
              type="number"
              value={newExpense}
              onChange={(e) => setNewExpense(Number(e.target.value))}
              placeholder="e.g., 400000"
            />
          </div>
          <Button onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Analyze
          </Button>
        </div>

        {analysisResult && (
          <div className="space-y-4 pt-4">
            <Alert variant={analysisResult.isAffordable ? 'default' : 'destructive'}>
               {analysisResult.isAffordable ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertTitle>{analysisResult.isAffordable ? "Affordable" : "Not Recommended"}</AlertTitle>
              <AlertDescription>
                {analysisResult.analysis}
              </AlertDescription>
            </Alert>

            <div>
              <h4 className="font-semibold mb-2">12-Month Cash Balance Projection</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Projected Cash Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisResult.projection.map((item) => (
                      <TableRow key={item.month} className={cn(item.isNegative && 'bg-destructive/10')}>
                        <TableCell className="font-medium">{item.month}</TableCell>
                        <TableCell className={cn("text-right", item.isNegative && 'text-destructive font-bold')}>
                          MMK {item.projectedCashBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
