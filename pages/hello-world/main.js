export const size = () => ({ width: 1024, height: 512 });
export default async () => {
  return { currentDate: new Date().toLocaleDateString() };
};
