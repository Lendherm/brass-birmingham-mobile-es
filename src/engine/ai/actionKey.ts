import type { PlayerAction } from '../game';

export function actionKey(action: PlayerAction): string {
  switch (action.type) {
    case 'build':
      return `build:${action.cardIdx}:${action.option.city}:${action.option.industry}:${action.option.slot}`;
    case 'network':
      return `network:${action.cardIdx}:${action.option.linkIds.join(',')}`;
    case 'sell':
      return `sell:${action.cardIdx}:${action.sales.map((s) => `${s.sale.city}:${s.sale.slot}`).join('|')}`;
    case 'develop':
      return `develop:${action.cardIdx}:${action.industries.join(',')}`;
    case 'loan':
      return `loan:${action.cardIdx}`;
    case 'scout':
      return `scout:${action.cardIdx}:${action.extraDiscards.join(',')}`;
    case 'pass':
      return `pass:${action.cardIdx}`;
  }
}

export function actionsMatch(a: PlayerAction, b: PlayerAction): boolean {
  return actionKey(a) === actionKey(b);
}
