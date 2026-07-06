import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing } from '../../../constants/theme';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: 'WEAPONS' | 'AMMO' | 'GEAR';
  stock: number;
  icon: string;
}

export default function CopShop({ theme }: { theme: any; isDark: boolean }) {
  const [credits, setCredits] = useState(4890);
  const [cart, setCart] = useState<Record<string, number>>({});

  const shopItems: ShopItem[] = [
    { id: '1', name: 'Tactical Holster (Blackhawk)', price: 120, category: 'GEAR', stock: 15, icon: 'shield' },
    { id: '2', name: 'Level IV Body Armor Plate', price: 450, category: 'GEAR', stock: 8, icon: 'shield' },
    { id: '3', name: '9mm NATO Rounds (Box of 50)', price: 45, category: 'AMMO', stock: 40, icon: 'box' },
    { id: '4', name: '5.56x45mm Rounds (Box of 30)', price: 55, category: 'AMMO', stock: 35, icon: 'box' },
    { id: '5', name: 'Taser X2 Defender kit', price: 350, category: 'WEAPONS', stock: 5, icon: 'zap' },
  ];

  const addToCart = (itemId: string) => {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    const currentQty = cart[itemId] || 0;
    if (currentQty >= item.stock) {
      Alert.alert('⚠️ STOCK LIMIT', 'No more inventory available for checkout.');
      return;
    }

    setCart({
      ...cart,
      [itemId]: currentQty + 1,
    });
  };

  const removeFromCart = (itemId: string) => {
    const currentQty = cart[itemId] || 0;
    if (currentQty <= 0) return;

    const newCart = { ...cart };
    if (currentQty === 1) {
      delete newCart[itemId];
    } else {
      newCart[itemId] = currentQty - 1;
    }
    setCart(newCart);
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, qty]) => {
      const item = shopItems.find(i => i.id === itemId);
      return total + (item ? item.price * qty : 0);
    }, 0);
  };

  const checkout = () => {
    const total = getCartTotal();
    if (total === 0) return;

    if (credits < total) {
      Alert.alert('❌ COOLDOWN / INSUFFICIENT CREDITS', 'Requisition request denied due to insufficient credit allocations.');
      return;
    }

    setCredits(prev => prev - total);
    setCart({});
    Alert.alert(
      '✓ ORDER PLACED',
      `Gear request logged. Badge balance debited by $${total}. Items dispatched to locker.`,
      [{ text: 'RECEIPT CONFIRMED' }]
    );
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerBlock}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>QUARTERMASTER CATALOG</Text>
        <View style={[styles.creditsBadge, { backgroundColor: theme.primaryGlow }]}>
          <Feather name="credit-card" size={14} color={theme.primary} />
          <Text style={[styles.creditsText, { color: theme.primary }]}>BALANCE: ${credits}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollBlock} showsVerticalScrollIndicator={false}>
        {shopItems.map((item) => {
          const cartQty = cart[item.id] || 0;
          return (
            <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.itemInfo}>
                <View style={[styles.iconBox, { backgroundColor: theme.primaryGlow }]}>
                  <Feather name={item.icon as any} size={18} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>
                    CAT: {item.category} • STOCK: {item.stock}
                  </Text>
                </View>
              </View>

              <View style={styles.actionGroup}>
                <Text style={[styles.itemPrice, { color: theme.primary }]}>${item.price}</Text>
                <View style={styles.qtyControls}>
                  {cartQty > 0 && (
                    <Pressable style={[styles.qtyBtn, { borderColor: theme.border }]} onPress={() => removeFromCart(item.id)}>
                      <Feather name="minus" size={12} color={theme.text} />
                    </Pressable>
                  )}
                  {cartQty > 0 && <Text style={[styles.qtyText, { color: theme.text }]}>{cartQty}</Text>}
                  <Pressable style={[styles.qtyBtn, { borderColor: theme.border }]} onPress={() => addToCart(item.id)}>
                    <Feather name="plus" size={12} color={theme.text} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {getCartTotal() > 0 && (
        <View style={[styles.checkoutPanel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>REQ TOTAL:</Text>
            <Text style={[styles.totalVal, { color: theme.primary }]}>${getCartTotal()}</Text>
          </View>
          <Pressable style={[styles.checkoutBtn, { backgroundColor: theme.primary }]} onPress={checkout}>
            <Text style={styles.checkoutBtnText}>CONFIRM SECURED REQUISITION</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
  },
  headerBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  creditsText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollBlock: {
    maxHeight: 280,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  itemMeta: {
    fontSize: 8.5,
    marginTop: 2,
  },
  actionGroup: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  checkoutPanel: {
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: Spacing.two,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  totalVal: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkoutBtn: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
  },
});
