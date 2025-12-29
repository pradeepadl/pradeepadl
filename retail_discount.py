def calculate_discount(is_member, order_amount):
    """
    Calculate discount based on membership and order amount.

    Rules:
    - Members: 10% if order > $100, 5% if $50 < order <= $100, 0% otherwise
    - Non-members: 5% if order > $100, 0% otherwise
    """
    if is_member:
        if order_amount > 100:
            return 0.10
        elif order_amount > 50:
            return 0.05
        else:
            return 0.00
    else:
        if order_amount > 100:
            return 0.05
        else:
            return 0.00


# Test cases
print("Testing discount calculator:")

# Member tests
print(f"Member, $120: {calculate_discount(True, 120)*100}%")  # 10%
print(f"Member, $80: {calculate_discount(True, 80)*100}%")   # 5%
print(f"Member, $40: {calculate_discount(True, 40)*100}%")   # 0%

# Non-member tests
print(f"Non-member, $120: {calculate_discount(False, 120)*100}%")  # 5%
print(f"Non-member, $80: {calculate_discount(False, 80)*100}%")    # 0%

# Edge cases
print(f"Member, $100: {calculate_discount(True, 100)*100}%")         # 5% (not over 100)
print(f"Member, $50: {calculate_discount(True, 50)*100}%")           # 0% (not over 50)
print(f"Non-member, $100: {calculate_discount(False, 100)*100}%")    # 0% (not over 100 for non-member)
print(f"Member, $100.01: {calculate_discount(True, 100.01)*100}%")   # 10%
print(f"Member, $50.01: {calculate_discount(True, 50.01)*100}%")     # 5%
print(f"Non-member, $100.01: {calculate_discount(False, 100.01)*100}%")  # 5%
