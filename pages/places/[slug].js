import { renderHtmlAsImageBuffer } from '../../src/renderer.js'

export async function loader({ params }) {
  const { slug } = params;
  return { slug }
}

