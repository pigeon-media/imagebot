export default async () => {
  return { date: new Date().toISOString() };
};

export const size = () => ({
  width: 1024,
  height: 512,
})