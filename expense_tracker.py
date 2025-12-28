"""
Personal Expense Tracker
A simple application to track monthly expenses against a budget
"""

import json
import os
import csv
from datetime import datetime

class ExpenseTracker:
    def __init__(self):
        self.csv_file = "expenses.csv"
        self.budget_file = "budget.txt"
        self.monthly_budget = 0
        self.expenses = []
        self.load_budget()
        self.load_expenses()
    
    def load_budget(self):
        """Load budget from file"""
        if os.path.exists(self.budget_file):
            try:
                with open(self.budget_file, 'r') as f:
                    self.monthly_budget = float(f.read().strip())
            except:
                self.monthly_budget = 0

    def save_budget(self):
        """Save budget to file"""
        with open(self.budget_file, 'w') as f:
            f.write(str(self.monthly_budget))

    def load_expenses(self):
        """Load expenses from CSV file"""
        if os.path.exists(self.csv_file):
            try:
                with open(self.csv_file, 'r', newline='') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        try:
                            # Convert amount to float
                            row['amount'] = float(row['amount'])
                            self.expenses.append(row)
                        except (ValueError, KeyError):
                            continue  # Skip invalid rows
            except:
                print("Error loading expenses from file.")

    def save_expenses_to_csv(self):
        """Save expenses to CSV file"""
        try:
            with open(self.csv_file, 'w', newline='') as f:
                if self.expenses:
                    fieldnames = ['date', 'category', 'amount', 'description']
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    for expense in self.expenses:
                        writer.writerow(expense)
            print("\n✓ Expenses saved to CSV file successfully!")
        except Exception as e:
            print(f"\n❌ Error saving expenses: {e}")

    def set_monthly_budget(self):
        """Set monthly budget"""
        print("\n" + "="*50)
        print("SET MONTHLY BUDGET")
        print("="*50)

        while True:
            try:
                budget = float(input("Enter the total amount you want to budget for the month: $"))
                if budget <= 0:
                    print("Budget must be greater than 0. Please try again.")
                    continue
                self.monthly_budget = budget
                self.save_budget()
                print(f"\n✓ Monthly budget set to: ${self.monthly_budget:.2f}")
                break
            except ValueError:
                print("Invalid input. Please enter a valid number.")

    def track_budget(self):
        """Track budget by calculating total expenses and comparing to budget"""
        if self.monthly_budget == 0:
            print("\n⚠ Please set your monthly budget first!")
            return

        total_expenses = sum(expense['amount'] for expense in self.expenses if isinstance(expense.get('amount'), (int, float)))
        remaining = self.monthly_budget - total_expenses

        print("\n" + "="*50)
        print("BUDGET TRACKING")
        print("="*50)
        print(f"Monthly Budget: ${self.monthly_budget:.2f}")
        print(f"Total Expenses: ${total_expenses:.2f}")
        print(f"Remaining:     ${remaining:.2f}")

        if total_expenses > self.monthly_budget:
            print(f"\n⚠️ You have exceeded your budget by ${abs(remaining):.2f}!")
        else:
            print(f"\n✓ You have ${remaining:.2f} left for the month.")

        print("="*50)
    
    def add_expense(self):
        """Add a new expense"""
        if self.monthly_budget == 0:
            print("\n⚠ Please set your monthly budget first!")
            return

        print("\n" + "="*50)
        print("ADD NEW EXPENSE")
        print("="*50)

        # Get expense date
        while True:
            date_input = input("Enter expense date (YYYY-MM-DD): ").strip()
            try:
                # Validate date format
                datetime.strptime(date_input, "%Y-%m-%d")
                break
            except ValueError:
                print("Invalid date format. Please use YYYY-MM-DD format.")

        # Get expense category
        print("\nCategories: Food, Transportation, Entertainment, Bills, Shopping, Healthcare, Other")
        category = input("Enter category (such as Food or Travel): ").strip().capitalize()
        if not category:
            category = "Other"

        # Get expense amount
        while True:
            try:
                amount = float(input("Enter expense amount: $"))
                if amount <= 0:
                    print("Amount must be greater than 0. Please try again.")
                    continue
                break
            except ValueError:
                print("Invalid input. Please enter a valid number.")

        # Get expense description
        description = input("Enter a brief description of the expense: ").strip()
        if not description:
            print("Description cannot be empty!")
            return

        # Create expense record
        expense = {
            'date': date_input,
            'category': category,
            'amount': amount,
            'description': description
        }

        self.expenses.append(expense)
        self.save_expenses_to_csv()
        print(f"\n✓ Expense added successfully!")
        self.track_budget()
    
    def view_expenses(self):
        """View all expenses with validation"""
        if not self.expenses:
            print("\n📊 No expenses recorded yet.")
            return

        print("\n" + "="*50)
        print("EXPENSE HISTORY")
        print("="*50)

        total = 0
        valid_count = 0
        invalid_count = 0

        for i, expense in enumerate(self.expenses, 1):
            # Validate required fields
            if not isinstance(expense, dict):
                print(f"\n{i}. ❌ Invalid expense format (not a dictionary)")
                invalid_count += 1
                continue

            date = expense.get('date', '').strip()
            category = expense.get('category', '').strip()
            amount = expense.get('amount')
            description = expense.get('description', '').strip()

            # Check if all required fields are present and valid
            missing_fields = []
            if not date:
                missing_fields.append('date')
            if not category:
                missing_fields.append('category')
            if amount is None or not isinstance(amount, (int, float)) or amount <= 0:
                missing_fields.append('amount')
            if not description:
                missing_fields.append('description')

            if missing_fields:
                print(f"\n{i}. ❌ Incomplete expense - missing: {', '.join(missing_fields)}")
                invalid_count += 1
                continue

            # Display valid expense
            print(f"\n{i}. {description}")
            print(f"   Amount: ${amount:.2f}")
            print(f"   Category: {category}")
            print(f"   Date: {date}")
            total += amount
            valid_count += 1

        print("\n" + "-"*50)
        print(f"Valid Expenses: {valid_count}")
        print(f"Invalid Expenses: {invalid_count}")
        print(f"Total Valid Expenses: ${total:.2f}")
        print("="*50)
    
    def show_summary(self):
        """Show budget summary"""
        if self.monthly_budget == 0:
            print("\n⚠ Please set your monthly budget first!")
            return
        
        total_spent = sum(expense['amount'] for expense in self.expenses)
        remaining = self.monthly_budget - total_spent
        percentage_used = (total_spent / self.monthly_budget) * 100
        
        print("\n" + "="*50)
        print("BUDGET SUMMARY")
        print("="*50)
        print(f"Monthly Budget:    ${self.monthly_budget:.2f}")
        print(f"Total Spent:       ${total_spent:.2f}")
        print(f"Remaining:         ${remaining:.2f}")
        print(f"Budget Used:       {percentage_used:.1f}%")
        
        if remaining < 0:
            print(f"\n⚠️  WARNING: You have exceeded your budget by ${abs(remaining):.2f}!")
        elif percentage_used > 80:
            print(f"\n⚠️  CAUTION: You have used {percentage_used:.1f}% of your budget!")
        else:
            print(f"\n✓ You're within budget! Keep it up!")
        
        print("="*50)
    
    def view_by_category(self):
        """View expenses grouped by category"""
        if not self.expenses:
            print("\n📊 No expenses recorded yet.")
            return
        
        print("\n" + "="*50)
        print("EXPENSES BY CATEGORY")
        print("="*50)
        
        categories = {}
        for expense in self.expenses:
            category = expense['category']
            if category not in categories:
                categories[category] = 0
            categories[category] += expense['amount']
        
        for category, amount in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            percentage = (amount / self.monthly_budget) * 100
            print(f"{category:15} ${amount:8.2f}  ({percentage:.1f}% of budget)")
        
        print("="*50)
    
    def reset_expenses(self):
        """Reset all expenses (keep budget)"""
        print("\n⚠️  WARNING: This will delete all expense records!")
        choice = input("Are you sure you want to reset? (yes/no): ").lower()
        if choice == 'yes':
            self.expenses = []
            self.save_expenses_to_csv()
            print("\n✓ All expenses have been reset.")
    
    def display_menu(self):
        """Display main menu"""
        print("\n" + "="*50)
        print("PERSONAL EXPENSE TRACKER")
        print("="*50)
        print("1. Add expense")
        print("2. View expenses")
        print("3. Track budget")
        print("4. Save expenses")
        print("5. Exit")
        print("="*50)

    def run(self):
        """Main application loop"""
        print("\n🎯 Welcome to Personal Expense Tracker!")

        while True:
            self.display_menu()
            choice = input("\nEnter your choice (1-5): ").strip()

            if choice == '1':
                self.add_expense()
            elif choice == '2':
                self.view_expenses()
            elif choice == '3':
                self.track_budget()
            elif choice == '4':
                self.save_expenses_to_csv()
            elif choice == '5':
                self.save_expenses_to_csv()
                print("\n👋 Thank you for using Personal Expense Tracker!")
                print("Your expenses have been saved. Goodbye!\n")
                break
            else:
                print("\n❌ Invalid choice. Please enter a number between 1 and 5.")

def main():
    tracker = ExpenseTracker()
    tracker.run()

if __name__ == "__main__":
    main()
