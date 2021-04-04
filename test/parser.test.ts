import { parseCql } from "../src/cql/parser/parser";
import { InvalidQueryError } from "../src/cql/parser/error";
import { spaceQuery, labelListQuery, multQuery, multQuery2, precedenceQuery, precedenceQuery2, makeTitleQuery } from "./testData";

describe("CQL Parser", () => {
    test("Can parse title query", () => {
        expect(parseCql("title ~ \"auto\"")).toEqual(makeTitleQuery("auto"));
    });

    test("Is case insensitive", () => {
        expect(parseCql("title ~ \"AUTO\"")).toEqual(makeTitleQuery("auto"));
    });

    test("Allow single quotes", () => {
        expect(parseCql( "title ~ 'auto'")).toEqual(makeTitleQuery("auto"));
    });

    test("allow Space in quotes", () => {
        expect(parseCql( "title ~ 'auto test'")).toEqual(makeTitleQuery("auto test"));
    });
    test("allow digits in quotes", () => {
        expect(parseCql( "title ~ 'auto123'")).toEqual(makeTitleQuery("auto123"));
    });

    test("No whitespace", () => {
        expect(parseCql("title~\"auto\"")).toEqual(makeTitleQuery("auto"));
    });

    test("Forces quotation marks", () => {
        expect(() => parseCql( "title ~ auto")).toThrowError(InvalidQueryError);
    });

    test("Rejects empty string", () => {
        expect(() => parseCql("")).toThrowError(InvalidQueryError);
    });

    test("Consumes entire query", () => {
        expect(() => parseCql( "title ~ 'auto' dcdwcwed")).toThrowError(InvalidQueryError);
    });

    test("Can parse space query", () => {
        expect(parseCql("space = 'DEV'")).toEqual(spaceQuery);
    });

    test("Can parse query with list", () => {
        expect(parseCql("label in (test, dev, abc)")).toEqual(labelListQuery);
    });


    test("Can join 2 queries together", () => {
        expect(parseCql("title ~ \"auto\" AND space = 'DEV'"))
        .toEqual(multQuery);
    });

    test("Ignores brackets", () => {
        expect(parseCql("(title ~ \"auto\") AND (space = 'DEV')")).toEqual(multQuery);
    });

    test("Test Associativity", () => {
        expect(parseCql("space = 'DEV' AND title ~ \"auto\"")).toEqual(multQuery2);
    });

    test("Invalid Parse", () => {
        expect(() => parseCql("xyz")).toThrowError(InvalidQueryError);
    });

    test("Invalid Parse 2", () => {
        expect(() => parseCql("title > \"auto\"")).toThrowError(InvalidQueryError);
    });
    
    test("Correct precedence", () => {
        expect(parseCql("label = 'test' OR space = 'DEV' AND title ~ \"auto\"")).toEqual(precedenceQuery);
    });

    test("Correct precedence with brackets", () => {
        expect(parseCql("(label = 'test' OR space = 'DEV') AND title ~ \"auto\"")).toEqual(precedenceQuery2);
    });

});


