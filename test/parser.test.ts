import { parseCql } from "../src/cql/parser/parser";
import { InvalidQueryError } from "../src/cql/parser/error";
import { spaceQuery, labelListQuery, multQuery, multQuery2, precedenceQuery, precedenceQuery2, makeTitleQuery } from "./testData";
import { betweenBrackets, sepByCommas } from "../src/cql/parser/utility";
import { Streams } from "@masala/parser";

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

    test("allow special characters in quotes", () => {
        expect(parseCql( "title ~ 'auto&test$%-'")).toEqual(makeTitleQuery("auto&test$%-"));
    });

    test("No whitespace", () => {
        expect(parseCql("title~\"auto\"")).toEqual(makeTitleQuery("auto"));
    });

    test("Ignore extra whitespace", () => {
        expect(parseCql("title ~ \"auto\"     ")).toEqual(makeTitleQuery("auto"));
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

    test("Rejects nested quotes", () => {
        expect(() => parseCql("space = \"DEV\"123\"")).toThrowError(InvalidQueryError);
    });

    test("Allow mixed quotes", () => {
        expect(parseCql("title ~ \"tim's plan\"")).toEqual(makeTitleQuery("tim's plan"));
    });

    test("Can parse query with list with items wrapped in quotes", () => {
        expect(parseCql("label in (\"test\", \"dev\", \"abc\")")).toEqual(labelListQuery);
    });

    test("Can parse query with list with items not wrapped in quotes", () => {
        expect(parseCql("label in (test, dev, abc)")).toEqual(labelListQuery);
    });


    test("Can join 2 queries together", () => {
        expect(parseCql("title ~ \"auto\" AND space = 'DEV'"))
        .toEqual(multQuery);
    });


    test("Ignores brackets 1", () => {
        expect(parseCql("(title ~ \"auto\")")).toEqual(makeTitleQuery("auto"));
    });
    
    test("Ignores brackets 2", () => {
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

describe("Generic Parsers", () => {
    test("Parses between brackets", () => {
        const parseResponse = betweenBrackets.parse(Streams.ofString("(a,b,c)"));
        expect(parseResponse.isAccepted()).toBe(true);
        expect(parseResponse.value).toBe("a,b,c");
    });

    describe("Sep by Commas", () => {
        test("Sep by commas separates values", () => {
            const parseResponse = sepByCommas.parse(Streams.ofString("ad,b,c"));
            console.log(parseResponse);
            expect(parseResponse.isAccepted()).toBe(true);
            expect(parseResponse.value).toEqual(["ad","b","c"]);
        });
    
        test("Sep by commas rejects empty string", () => {
            const parseResponse = sepByCommas.parse(Streams.ofString(""));
            expect(parseResponse.isAccepted()).toBe(false);
        });
    
        test("Sep by commas accepts single value", () => {
            const parseResponse = sepByCommas.parse(Streams.ofString("abc"));
            expect(parseResponse.isAccepted()).toBe(true);
            expect(parseResponse.value).toEqual(["abc"]);
        });
    
        test("Sep by commas incomplete fails", () => {
            const parseResponse = sepByCommas.parse(Streams.ofString("abc,"));
            expect(parseResponse.isAccepted()).toBe(false);
        });
    });

   
});

