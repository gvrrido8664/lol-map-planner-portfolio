const assets = import.meta.glob<string>("../assets/objectives/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});
export const objectiveIcon = (name: string) => assets[`../assets/objectives/${name}.png`];
