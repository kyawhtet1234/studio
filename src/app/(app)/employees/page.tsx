'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/lib/data-context';
import { PageHeader } from "@/components/app/page-header";
import { AddEntitySheet } from '@/components/app/products/add-entity-sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { AddEmployeeForm, RecordAdvanceForm, RecordLeaveForm } from '@/components/app/employees/forms';
import type { Employee, SalaryAdvance, LeaveRecord } from '@/lib/types';
import { MoreHorizontal, Calendar as CalendarIcon, DollarSign, Trash2, FileCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, lastDayOfMonth, subMonths, addMonths, isSameMonth } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const LEAVE_BONUS = 20000;
const PAYROLL_CATEGORY_NAME = 'Employee Wages';

export default function EmployeesPage() {
  const { 
    employees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    salaryAdvances,
    addSalaryAdvance,
    deleteSalaryAdvance,
    leaveRecords,
    addLeaveRecord,
    deleteLeaveRecord,
    expenses,
    addExpense,
    expenseCategories,
    addExpenseCategory,
  } = useData();

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdvanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
  const [deletingAdvance, setDeletingAdvance] = useState<SalaryAdvance | null>(null);
  const [deletingLeave, setDeletingLeave] = useState<LeaveRecord | null>(null);
  const [isPayrollAlertOpen, setIsPayrollAlertOpen] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState(new Date());


  const { toast } = useToast();

  const monthStart = startOfMonth(payrollMonth);
  const monthEnd = endOfMonth(payrollMonth);

  const monthAdvances = useMemo(() => {
    return salaryAdvances.filter(a => {
      const advanceDate = a.date as Date;
      return advanceDate >= monthStart && advanceDate <= monthEnd;
    });
  }, [salaryAdvances, monthStart, monthEnd]);

  const monthLeaves = useMemo(() => {
    return leaveRecords.filter(l => {
      const leaveDate = l.date as Date;
      return leaveDate >= monthStart && leaveDate <= monthEnd;
    });
  }, [leaveRecords, monthStart, monthEnd]);

  const employeeCalculations = useMemo(() => {
    return employees.map(employee => {
        const advances = monthAdvances.filter(a => a.employeeId === employee.id);
        const totalAdvance = advances.reduce((sum, a) => sum + a.amount, 0);
        const leaves = monthLeaves.filter(l => l.employeeId === employee.id);
        const hasTakenLeave = leaves.length > 0;
        const bonus = hasTakenLeave ? 0 : LEAVE_BONUS;
        const finalSalary = employee.baseSalary - totalAdvance + bonus;
        return {
            ...employee,
            advances,
            totalAdvance,
            leaves,
            hasTakenLeave,
            bonus,
            finalSalary
        };
    });
  }, [employees, monthAdvances, monthLeaves]);

  const isPayrollPosted = useMemo(() => {
    const payrollCategory = expenseCategories.find(c => c.name === PAYROLL_CATEGORY_NAME);
    if (!payrollCategory) return false;

    return expenses.some(e => {
        const expenseDate = e.date as Date;
        return e.categoryId === payrollCategory.id && 
               expenseDate.getMonth() === payrollMonth.getMonth() &&
               expenseDate.getFullYear() === payrollMonth.getFullYear() &&
               e.description.includes('Monthly Payroll');
    });
  }, [expenses, expenseCategories, payrollMonth]);


  const handleOpenAdvanceModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setAdvanceModalOpen(true);
  };

  const handleOpenLeaveModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setLeaveModalOpen(true);
  };
  
  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditing(true);
  };
  
  const handleDelete = async (employeeId: string) => {
    await deleteEmployee(employeeId);
    toast({ title: 'Employee Removed', description: 'Employee data has been successfully deleted.' });
  };
  
  const handleDeleteAdvance = async (advanceId: string) => {
    await deleteSalaryAdvance(advanceId);
    toast({ title: 'Advance Deleted', description: 'Salary advance record has been removed.' });
    setDeletingAdvance(null);
  };

  const handleDeleteLeave = async (leaveId: string) => {
    await deleteLeaveRecord(leaveId);
    toast({ title: 'Leave Record Deleted', description: 'Leave record has been removed.' });
    setDeletingLeave(null);
  };

  const handleFinalizePayroll = async () => {
    setIsPayrollAlertOpen(false);

    if (isPayrollPosted) {
        toast({ variant: 'destructive', title: 'Payroll Already Posted', description: 'Payroll for this month has already been recorded as an expense.' });
        return;
    }

    let payrollCategory = expenseCategories.find(c => c.name === PAYROLL_CATEGORY_NAME);

    if (!payrollCategory) {
        await addExpenseCategory({ name: PAYROLL_CATEGORY_NAME });
        const updatedCategories = await expenseCategories;
        const newCategory = updatedCategories.find(c => c.name === PAYROLL_CATEGORY_NAME);
        if(!newCategory) {
             toast({ variant: 'destructive', title: 'Error', description: `Could not find or create the '${PAYROLL_CATEGORY_NAME}' category. Please create it manually in Settings and try again.` });
             return;
        }
        payrollCategory = newCategory;
    }
    
    if (!payrollCategory) {
      const allCategories = expenseCategories;
      const foundCategory = allCategories.find(c => c.name === PAYROLL_CATEGORY_NAME);
      if(!foundCategory){
         toast({ variant: 'destructive', title: 'Error', description: 'Could not find the payroll category. Please try again.' });
         return;
      }
      payrollCategory = foundCategory;
    }


    const totalPayroll = employeeCalculations.reduce((sum, emp) => sum + emp.finalSalary, 0);

    if (totalPayroll <= 0) {
        toast({ title: 'No Payroll to Post', description: 'Total payroll for the month is zero or less.' });
        return;
    }

    const payrollExpense = {
        date: lastDayOfMonth(payrollMonth),
        categoryId: payrollCategory.id,
        description: `Monthly Payroll for ${format(payrollMonth, 'MMMM yyyy')}`,
        amount: totalPayroll,
    };

    await addExpense(payrollExpense);

    toast({ title: 'Payroll Posted!', description: `An expense of MMK ${totalPayroll.toLocaleString()} has been recorded for this month's payroll.` });
  };

  const changeMonth = (direction: 'prev' | 'next') => {
      setPayrollMonth(current => direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1));
  }

  return (
    <div>
      <PageHeader title="Employee Management">
        <div className="flex gap-2 items-center flex-wrap">
             <div className="flex items-center gap-2 border rounded-md p-1">
                <Button variant="ghost" size="icon" onClick={() => changeMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-semibold text-sm">{format(payrollMonth, 'MMMM yyyy')}</span>
                <Button variant="ghost" size="icon" onClick={() => changeMonth('next')} disabled={isSameMonth(payrollMonth, new Date())}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <Button variant="outline" onClick={() => setIsPayrollAlertOpen(true)} disabled={isPayrollPosted}>
                <FileCheck className="mr-2 h-4 w-4" />
                {isPayrollPosted ? 'Payroll Posted' : 'Finalize & Post Payroll'}
            </Button>
            <AddEntitySheet buttonText="Add Employee" title="Add New Employee" description="Enter the details for a new employee.">
              {(onSuccess) => <AddEmployeeForm onSave={addEmployee} onSuccess={onSuccess} />}
            </AddEntitySheet>
        </div>
      </PageHeader>
      
      <div className="grid grid-cols-1 gap-6">
        {employeeCalculations.map(employee => (
            <Card key={employee.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{employee.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleEdit(employee)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(employee.id)} className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Salary</span>
                  <span className="font-medium">MMK {employee.baseSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Advances</span>
                  <span className="font-medium text-destructive">- MMK {employee.totalAdvance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No-Leave Bonus</span>
                  <span className={`font-medium ${employee.hasTakenLeave ? 'text-muted-foreground' : 'text-green-600'}`}>{employee.hasTakenLeave ? 'N/A' : `+ MMK ${employee.bonus.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Final Salary</span>
                  <span>MMK {employee.finalSalary.toLocaleString()}</span>
                </div>

                <div>
                    <h4 className="font-semibold text-sm mb-2">{format(payrollMonth, 'MMMM')}'s Advances</h4>
                    <div className="space-y-1 text-xs">
                        {employee.advances.map(a => (
                            <div key={a.id} className="flex justify-between items-center">
                                <span>{format(a.date as Date, 'PP')} - {a.notes}</span>
                                <span>-MMK {a.amount.toLocaleString()} <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setDeletingAdvance(a)}><Trash2 className="h-3 w-3 text-destructive"/></Button></span>
                            </div>
                        ))}
                        {employee.advances.length === 0 && <p className="text-muted-foreground text-center text-xs py-2">No advances this month.</p>}
                    </div>
                </div>

                 <div>
                    <h4 className="font-semibold text-sm mb-2">{format(payrollMonth, 'MMMM')}'s Leaves</h4>
                     <div className="space-y-1 text-xs">
                        {employee.leaves.map(l => (
                             <div key={l.id} className="flex justify-between items-center">
                                <span>{format(l.date as Date, 'PP')}</span>
                                <span><Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setDeletingLeave(l)}><Trash2 className="h-3 w-3 text-destructive"/></Button></span>
                            </div>
                        ))}
                        {employee.leaves.length === 0 && <p className="text-muted-foreground text-center text-xs py-2">No leaves this month.</p>}
                    </div>
                </div>

              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => handleOpenAdvanceModal(employee)}><DollarSign className="mr-2 h-4 w-4"/>Record Advance</Button>
                <Button variant="outline" onClick={() => handleOpenLeaveModal(employee)}><CalendarIcon className="mr-2 h-4 w-4"/>Record Leave</Button>
              </CardFooter>
            </Card>
          ))}
      </div>
      
      <Dialog open={!!selectedEmployee && isEditing} onOpenChange={() => {setSelectedEmployee(null); setIsEditing(false);}}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Employee</DialogTitle>
            </DialogHeader>
            {selectedEmployee && <AddEmployeeForm onSave={(data) => updateEmployee(selectedEmployee.id, data)} onSuccess={() => {setSelectedEmployee(null); setIsEditing(false);}} employee={selectedEmployee} />}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAdvanceModalOpen} onOpenChange={setAdvanceModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Record Salary Advance for {selectedEmployee?.name}</DialogTitle>
                <DialogDescription>Enter the date and amount for the advance.</DialogDescription>
            </DialogHeader>
            {selectedEmployee && <RecordAdvanceForm employee={selectedEmployee} onSave={addSalaryAdvance} onSuccess={() => setAdvanceModalOpen(false)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isLeaveModalOpen} onOpenChange={setLeaveModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Record Leave for {selectedEmployee?.name}</DialogTitle>
                 <DialogDescription>Select the date the employee was on leave.</DialogDescription>
            </DialogHeader>
            {selectedEmployee && <RecordLeaveForm employee={selectedEmployee} onSave={addLeaveRecord} onSuccess={() => setLeaveModalOpen(false)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingAdvance} onOpenChange={() => setDeletingAdvance(null)}>
        <DialogContent>
            <DialogHeader><DialogTitle>Delete Advance?</DialogTitle></DialogHeader>
            <p>Are you sure you want to delete this advance of MMK {deletingAdvance?.amount.toLocaleString()} on {deletingAdvance && format(deletingAdvance.date as Date, 'PP')}?</p>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDeletingAdvance(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => handleDeleteAdvance(deletingAdvance!.id)}>Delete</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!deletingLeave} onOpenChange={() => setDeletingLeave(null)}>
        <DialogContent>
            <DialogHeader><DialogTitle>Delete Leave Record?</DialogTitle></DialogHeader>
            <p>Are you sure you want to delete this leave record on {deletingLeave && format(deletingLeave.date as Date, 'PP')}?</p>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDeletingLeave(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => handleDeleteLeave(deletingLeave!.id)}>Delete</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isPayrollAlertOpen} onOpenChange={setIsPayrollAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Finalize Payroll for {format(payrollMonth, 'MMMM yyyy')}?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will create a single expense entry for the total final salary of all employees for the selected month.
                    This action can only be performed once per month. Are you sure you want to continue?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleFinalizePayroll}>Confirm & Post</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
