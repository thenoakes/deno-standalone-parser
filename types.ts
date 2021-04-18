export type AnyEnum = string | number;

// Enforce that a newly instantiated Token Analyser must first have 
// its token classifer set
export interface TAStage0<TToken extends AnyEnum, TGroup extends AnyEnum> {
  /** Sets a classifier function which is used to map each character to a TGroup */
  setClassifier: (
    classifier: (character: string) => TGroup
  ) => TAStage1<TToken, TGroup>;
}

// Enforce that a whenTokenIs call must be followed by a fromAnyOf call
export interface TAStage1<TToken extends AnyEnum, TGroup extends AnyEnum> {
  /**
   * Begins a block of transitions by specifying which token
   * they apply to
   */
  whenTokenIs: (token: TToken) => TAStage2<TToken, TGroup>;
}

// Enforce that a fromAnyOf call must be followed by a toAnyOf call
export interface TAStage2<TToken extends AnyEnum, TGroup extends AnyEnum> {
  /**
   * Begins the definition of a transition by specifying
   * a 'before' set of character groups that this transition applies to
   */
  fromAnyOf: (group: TGroup, ...args: TGroup[]) => TAStage3<TToken, TGroup>;
}

// Enforce that a toAnyOf call must be followed by a setsToken call
export interface TAStage3<TToken extends AnyEnum, TGroup extends AnyEnum> {
  /**
   * Continues the definition of a transition by specifying
   * an 'after' set of character groups that this transition applies to
   */
  toAnyOf: (group: TGroup, ...args: TGroup[]) => TAStage4<TToken, TGroup>;
}

// Enforce a setsToken call to be followed by either
// - a whenTokenIs call (starting a new block)
// - an additional fromAnyOf call
// - an analyse call (using the configuration to analyse a string)
export interface TAStage4<TToken extends AnyEnum, TGroup extends AnyEnum> {
  /**
   * Completes the definition of a transition by specifying the
   * which token results from this transition
   */
  setsToken: (token: TToken) => TAStage5<TToken, TGroup>;
}

// A token analyser in this state can either be run, or configured further
export interface TAStage5<TToken extends AnyEnum, TGroup extends AnyEnum> {
  /**
   * Begins a block of transitions by specifying which token
   * they apply to
   */
  whenTokenIs: (token: TToken) => TAStage2<TToken, TGroup>;
  /**
   * Begins the definition of a transition by specifying
   * a 'before' set of character groups that this transition applies to
   */
  fromAnyOf: (group: TGroup, ...args: TGroup[]) => TAStage3<TToken, TGroup>;
  /**
   * Performs analysis on the provided string based on the specified transitions,
   * assuming that the first token is of the type specified
   */
  analyse: (value: string, startingToken: TToken) => ParsedToken<TToken>[];
}

export type Transition<TToken extends AnyEnum, TGroup extends AnyEnum> = {
  currentToken: TToken;
  from: TGroup[];
  to: TGroup[];
  newToken?: TToken;
};

export type ParsedToken<TToken extends AnyEnum> = {
  type: TToken;
  value: string;
};