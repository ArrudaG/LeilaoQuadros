import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const MAPEAMENTO = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'person.crop.circle.fill': 'person',
  'shield.fill': 'shield',
  'list.bullet.rectangle.fill': 'view-list',
  'trophy.fill': 'emoji-events',
  'chart.bar.fill': 'dashboard',
  'gavel.fill': 'gavel',
  'person.3.fill': 'groups',
  rosette: 'workspace-premium',
  'shippingbox.fill': 'local-shipping',
  'bolt.fill': 'bolt',
  'camera.fill': 'photo-camera',
  'photo.fill': 'photo-library',
  'trash.fill': 'delete',
  'xmark': 'close',
  'pencil': 'edit',
  'eye.fill': 'visibility',
  'timer': 'timer',
  'leaderboard.fill': 'leaderboard',
  'logout': 'logout',
  'payments.fill': 'payments',
  'location.fill': 'location-on',
  'send.fill': 'send',
  'add.photo': 'add-photo-alternate',
  'warning.fill': 'warning',
  'check.circle.fill': 'check-circle',
  'arrow.right': 'arrow-forward',
};

export function IconeSimbolo({ name, size = 24, color, style }) {
  return <MaterialIcons color={color} size={size} name={MAPEAMENTO[name]} style={style} />;
}
