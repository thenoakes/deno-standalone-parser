import { TokenAnalyser } from "./parser.ts";
import { assertEquals } from "https://deno.land/std@0.101.0/testing/asserts.ts";

/**
 * @fileoverview
 * A test for SQL-like dates of format YYYY-MM-DD
 */

const { test } = Deno;

/** Individual charachters are either a number, a separator or illegal */
enum CharacterGroup {
  Number,
  Separator,
  Illegal,
}

/** 
 * The semantic subdivisions of a date string are:
 * Day|DMSeparator|Month|MYSeparator|Year
 */
enum DateToken {
  Day,
  DMSeparator,
  Month,
  MYSeparator,
  Year,
}

const characterClassifier = (char: string) => {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => i.toString()).includes(char)
    ? CharacterGroup.Number
    : ["-", "/", "."].includes(char)
      ? CharacterGroup.Separator
      : CharacterGroup.Illegal;
};

var analyser = TokenAnalyser<DateToken, CharacterGroup>(characterClassifier);

test({
  name: "dates",
  ignore: false,
  fn: () => {
    const configuredAnalyser = analyser

      .whenTokenIs(DateToken.Year)
      .legalCharacters(CharacterGroup.Number)
      .legalTransition(CharacterGroup.Number, CharacterGroup.Separator, DateToken.MYSeparator)

      .whenTokenIs(DateToken.MYSeparator)
      .legalTransition(CharacterGroup.Separator, CharacterGroup.Number, DateToken.Month)

      .whenTokenIs(DateToken.Month)
      .legalCharacters(CharacterGroup.Number)
      .legalTransition(CharacterGroup.Number, CharacterGroup.Separator, DateToken.DMSeparator)

      .whenTokenIs(DateToken.DMSeparator)
      .legalTransition(CharacterGroup.Separator, CharacterGroup.Number, DateToken.Day)

      .whenTokenIs(DateToken.Day)
      .legalCharacters(CharacterGroup.Number);
      
      const result = configuredAnalyser.analyse("2020-01-01", DateToken.Year);

    assertEquals(result.length, 5);
    assertEquals(result[0], { type: DateToken.Year, value: "2020" });
    assertEquals(result[2], { type: DateToken.Month, value: "01" });
    assertEquals(result[4], { type: DateToken.Day, value: "01" });
  },
});
