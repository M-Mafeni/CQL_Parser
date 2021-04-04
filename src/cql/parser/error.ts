export class InvalidQueryError extends Error {
    constructor() {
        super();
        this.message = "query could not be parsed";
        this.name = "InvalidQueryError";
    }
}