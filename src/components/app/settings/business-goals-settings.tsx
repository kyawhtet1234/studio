

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/lib/data-context';
import type { GoalsSettings } from '@/lib/types';

export function BusinessGoalsSettings() {
  const { toast } = useToast();
  const { settings, updateGoalsSettings } = useData();

  const [dailySalesGoal, setDailySalesGoal] = useState(0);
  const [monthlySalesGoalForIncentive, setMonthlySalesGoalForIncentive] = useState(0);
  const [employeeIncentiveAmount, setEmployeeIncentiveAmount] = useState(0);

  useEffect(() => {
    if (settings.goals) {
      setDailySalesGoal(settings.goals.dailySalesGoal || 0);
      setMonthlySalesGoalForIncentive(settings.goals.monthlySalesGoalForIncentive || 0);
      setEmployeeIncentiveAmount(settings.goals.employeeIncentiveAmount || 0);
    }
  }, [settings.goals]);

  const handleSave = async () => {
    const newSettings: GoalsSettings = {
      dailySalesGoal: Number(dailySalesGoal),
      monthlySalesGoalForIncentive: Number(monthlySalesGoalForIncentive),
      employeeIncentiveAmount: Number(employeeIncentiveAmount),
    };
    await updateGoalsSettings(newSettings);
    toast({
      title: 'Settings Saved',
      description: 'Your business goals have been updated.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Goals</CardTitle>
        <CardDescription>Set your business targets to track performance and manage incentives.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="daily-sales-goal">Daily Sales Goal (MMK)</Label>
          <Input 
            id="daily-sales-goal" 
            type="number"
            value={dailySalesGoal} 
            onChange={(e) => setDailySalesGoal(Number(e.target.value))} 
            placeholder="e.g., 500000" 
          />
        </div>
        <div className="space-y-4 p-4 border rounded-md">
            <h4 className="font-medium">Employee Incentive Program</h4>
            <div className="space-y-2">
                <Label htmlFor="monthly-sales-goal">Monthly Sales Goal for Incentive (MMK)</Label>
                <Input 
                    id="monthly-sales-goal" 
                    type="number"
                    value={monthlySalesGoalForIncentive} 
                    onChange={(e) => setMonthlySalesGoalForIncentive(Number(e.target.value))} 
                    placeholder="e.g., 15000000" 
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="incentive-amount">Employee Incentive Amount (MMK)</Label>
                <Input 
                    id="incentive-amount" 
                    type="number"
                    value={employeeIncentiveAmount} 
                    onChange={(e) => setEmployeeIncentiveAmount(Number(e.target.value))} 
                    placeholder="e.g., 50000" 
                />
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Settings</Button>
      </CardFooter>
    </Card>
  );
}
