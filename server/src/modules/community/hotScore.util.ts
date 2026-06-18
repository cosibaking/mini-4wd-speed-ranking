export function calcHotScore(likeCount: number, commentCount: number): number {
  return likeCount * 2 + commentCount * 3;
}
