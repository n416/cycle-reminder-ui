export interface DefaultEmoji {
  id: string; // Unicode文字そのもの
  name: string; // 日本語名
}

export const defaultEmojis: DefaultEmoji[] = [
  { id: '👍', name: 'グッド' },
  { id: '🙂', name: 'にこやか' },
  { id: '🎉', name: 'クラッカー' },
  { id: '⭕', name: 'まる' },
  { id: '❌', name: 'ばつ' },
  { id: '🔺', name: 'さんかく' },
  { id: '✅', name: 'チェック' },
  { id: '⚠️', name: '警告' },
  { id: '👀', name: '目' },
  { id: '🤔', name: '考え中' },
  { id: '😂', name: '嬉し泣き' },
  { id: '👏', name: '拍手' },
];