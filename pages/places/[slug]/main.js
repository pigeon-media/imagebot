export default async ({ params }) => {
  return { 
    date: new Date().toISOString(), 
    params 
  };
};

export const size = () => ({
  width: 1024,
  height: 512,
})