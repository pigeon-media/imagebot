

export async function loader() {
  return { message: "hello world" }
}

export async function render() {
  return { message: "render" }
}