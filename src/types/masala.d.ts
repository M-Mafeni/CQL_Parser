interface Option<T> {
    isPresent(): boolean;
    get():  T
}

interface ParseResponse<T> {
    value: T;
    isAccepted(): boolean
}