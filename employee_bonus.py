def calculate_bonus(years_of_service, performance_rating, base_salary):
    """
    Calculate bonus based on years of service, performance rating, and base salary.

    Rules:
    1. 20% bonus if >=10 years and Excellent rating
    2. 10% bonus if >=5 years and Good rating
    3. 5% bonus if <5 years and Average rating
    4. No bonus for Poor rating
    5. Bonus capped at $10,000
    """
    if performance_rating == 'Poor':
        bonus = 0.0
    else:
        if years_of_service >= 10 and performance_rating == 'Excellent':
            bonus = 0.20 * base_salary
        elif years_of_service >= 5 and performance_rating == 'Good':
            bonus = 0.10 * base_salary
        elif years_of_service < 5 and performance_rating == 'Average':
            bonus = 0.05 * base_salary
        else:
            bonus = 0.0

    # Cap at $10,000
    bonus = min(bonus, 10000.0)
    return bonus


# Test cases
print("Testing employee bonus calculator:")

# Example cases
print(f"${calculate_bonus(10, 'Excellent', 50000):.2f}")  # 20%, but cap at 10000? Wait 50000*0.2=10000, so capped
print(f"${calculate_bonus(6, 'Good', 40000):.2f}")      # 10%
print(f"${calculate_bonus(3, 'Average', 60000):.2f}")   # 5%
print(f"${calculate_bonus(1, 'Poor', 70000):.2f}")      # 0%

# Cap test: high salary (60000*0.2=12000 >10000, capped)
print(f"${calculate_bonus(12, 'Excellent', 60000):.2f}")

# Edge cases
print(f"${calculate_bonus(10, 'Good', 50000):.2f}")     # >=10 but Good: 10% (not excellent)
print(f"${calculate_bonus(3, 'Good', 60000):.2f}")      # <5 but Good: 0 (no condition matches)
print(f"${calculate_bonus(15, 'Poor', 70000):.2f}")     # Poor: 0
