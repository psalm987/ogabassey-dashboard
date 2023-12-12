export default async function rest(time: number) {
  new Promise((resolve) => setTimeout(resolve, time));
}
