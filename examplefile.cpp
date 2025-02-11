void fibonacci(int n) {
    if (n <= 0) {
        return "Input must be a positive integer";
    }
    
    int a = 0, b = 1;
    for (int i = 2; i <= n; ++i) {
        int c = a + b;
        a = b;
        b = c;
    }
    
    return b;
}