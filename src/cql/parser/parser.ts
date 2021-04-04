import { CQLTerm } from "../../types/cql";
import { InvalidQueryError } from "./error";

export function parseCql(query: string): CQLTerm | Error {
    throw new InvalidQueryError();
}