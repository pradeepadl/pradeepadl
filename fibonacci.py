def fibonacci(n):
    """
    Returns the first n numbers in the Fibonacci sequence.
    """
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    else:
        sequence = [0, 1]
        for i in range(2, n):
            sequence.append(sequence[i-1] + sequence[i-2])
        return sequence

# Example usage
if __name__ == "__main__":
    n = 5
    print(f"First {n} Fibonacci numbers: {fibonacci(n)}")
