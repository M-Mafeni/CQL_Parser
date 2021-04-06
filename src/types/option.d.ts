interface Option<T> {
    isPresent(): boolean;
    get():  T
}