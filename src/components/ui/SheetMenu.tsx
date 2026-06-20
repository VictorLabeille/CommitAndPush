import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, touch } from '@/theme/tokens';
import { fonts } from '@/theme/typography';
import { BottomSheet } from './BottomSheet';

export interface MenuItem {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'default' | 'danger';
  onPress: () => void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  items: MenuItem[];
}

/** Menu d'options en bottom sheet (déclenché par un kebab ⋯). */
export function SheetMenu({ visible, onClose, title, items }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.list}>
        {items.map((item) => {
          const danger = item.tone === 'danger';
          const color = danger ? colors.danger : colors.ink;
          return (
            <Pressable
              key={item.label}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              {item.icon ? <Ionicons name={item.icon} size={20} color={color} /> : null}
              <Text style={[styles.label, { color }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: touch.min,
    paddingHorizontal: 12,
    borderRadius: radii.input,
  },
  pressed: { backgroundColor: colors.card },
  label: { fontFamily: fonts.grotesk.medium, fontSize: 16 },
});
