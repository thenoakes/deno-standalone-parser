import { TokenAnalyser } from "./parser.ts";
import { assertEquals } from "https://deno.land/std@0.101.0/testing/asserts.ts";

const { test } = Deno;

enum CharacterGroup {
  Number,
  Separator,
  Other,
}

enum DateToken {
  Day,
  Month,
  Year,
  YMSeparator,
  MDSeparator,
  //End
}

var analyser = TokenAnalyser();
var configuredAnalyser = analyser.setClassifier((char: string) => {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => i.toString()).includes(char)
    ? CharacterGroup.Number
    : ["-", "/", "."].includes(char)
    ? CharacterGroup.Separator
    : CharacterGroup.Other;
});

  test({
    name: "dates",
    ignore: false,
    fn: () => {
      const result = configuredAnalyser

        .whenTokenIs(DateToken.Year)
        .fromAnyOf(CharacterGroup.Number)
        .toAnyOf(CharacterGroup.Number)
        .setsToken(DateToken.Year)
        .fromAnyOf(CharacterGroup.Number)
        .toAnyOf(CharacterGroup.Separator)
        .setsToken(DateToken.YMSeparator)

        .whenTokenIs(DateToken.YMSeparator)
        .fromAnyOf(CharacterGroup.Separator)
        .toAnyOf(CharacterGroup.Number)
        .setsToken(DateToken.Month)

        .whenTokenIs(DateToken.Month)
        .fromAnyOf(CharacterGroup.Number)
        .toAnyOf(CharacterGroup.Number)
        .setsToken(DateToken.Month)
        .fromAnyOf(CharacterGroup.Number)
        .toAnyOf(CharacterGroup.Separator)
        .setsToken(DateToken.MDSeparator)

        .whenTokenIs(DateToken.MDSeparator)
        .fromAnyOf(CharacterGroup.Separator)
        .toAnyOf(CharacterGroup.Number)
        .setsToken(DateToken.Day)

        .whenTokenIs(DateToken.Day)
        .fromAnyOf(CharacterGroup.Number)
        .toAnyOf(CharacterGroup.Number)
        .setsToken(DateToken.Day).analyse("2020-01-01", DateToken.Year);
  
      assertEquals(result.length, 5);
      assertEquals(result[0], { type: DateToken.Year, value: "2020" });
      assertEquals(result[2], { type: DateToken.Month, value: "01" });
      assertEquals(result[4], { type: DateToken.Day, value: "01" });
    },
  });



// console.log(analysis);
