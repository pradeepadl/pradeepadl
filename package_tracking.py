# Package Tracking System using List Data Structure

# Initialize an empty list to store tracking IDs
tracking_ids = []

def add_package(tracking_id):
    """Add a new tracking ID to the list."""
    if tracking_id not in tracking_ids:
        tracking_ids.append(tracking_id)
        print(f"Package {tracking_id} added to tracking system.")
    else:
        print(f"Package {tracking_id} is already being tracked.")

def remove_package(tracking_id):
    """Remove a delivered package from the list."""
    if tracking_id in tracking_ids:
        tracking_ids.remove(tracking_id)
        print(f"Package {tracking_id} removed (delivered).")
    else:
        print(f"Package {tracking_id} not found in tracking system.")

def check_package(tracking_id):
    """Check if a package is in transit (i.e., still in the list)."""
    if tracking_id in tracking_ids:
        return f"Package {tracking_id} is in transit."
    else:
        return f"Package {tracking_id} is not in transit (possibly delivered)."

def display_all_packages():
    """Display all packages currently in transit."""
    if tracking_ids:
        print("Packages in transit:", tracking_ids)
    else:
        print("No packages in transit.")

# Test cases
print("Testing Package Tracking System:")
print()

# Add packages
add_package("PKG001")
add_package("PKG002")
add_package("PKG003")
add_package("PKG001")  # Duplicate - should not add
print()

# Display all
display_all_packages()
print()

# Check packages
print(check_package("PKG001"))
print(check_package("PKG004"))  # Not in list
print()

# Remove packages
remove_package("PKG002")
remove_package("PKG004")  # Not in list - should not remove
print()

# Display after removal
display_all_packages()
