import {
  createElement,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Orbit,
  ArrowUpRight,
  Plus,
  Search,
  Minus,
  RotateCcw,
  BookOpen,
} from 'lucide';

const icons = {
  previous: ChevronLeft,
  next: ChevronRight,
  shuffle: Shuffle,
  orbit: Orbit,
  arrow: ArrowUpRight,
  plus: Plus,
  search: Search,
  minus: Minus,
  reset: RotateCcw,
  book: BookOpen,
};

export function icon(name) {
  const node = createElement(icons[name], {
    width: 18,
    height: 18,
    'stroke-width': 1.5,
    'aria-hidden': 'true',
    focusable: 'false',
  });
  node.classList.add('interface-icon');
  return node;
}

export function polishInterfaceIcons() {
  for (const [selector, name] of [
    ['#zoom-in', 'plus'],
    ['#zoom-out', 'minus'],
    ['#reset-view', 'reset'],
  ]) {
    document.querySelector(selector)?.replaceChildren(icon(name));
  }
  for (const selector of ['#hero-add > span', '#hero-explore > span'])
    document.querySelector(selector)?.replaceChildren(icon('arrow'));
  document.querySelector('.search-wrap > span')?.replaceChildren(icon('search'));
}
