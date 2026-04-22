export type ISOTimestamp = string;

export const nowIso = (): ISOTimestamp => new Date().toISOString();

let fixtureCounter = 0;
export const nextFixtureId = (prefix: string): string => {
  fixtureCounter += 1;
  return `${prefix}_${fixtureCounter.toString().padStart(4, "0")}`;
};
