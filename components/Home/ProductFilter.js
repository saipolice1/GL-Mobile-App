import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  ScrollView 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const SORT_OPTIONS = [
  { id: 'default', label: 'Default', icon: 'sort' },
  { id: 'price-low', label: 'Price: Low to High', icon: 'sort-ascending' },
  { id: 'price-high', label: 'Price: High to Low', icon: 'sort-descending' },
  { id: 'name-az', label: 'Name: A to Z', icon: 'sort-alphabetical-ascending' },
  { id: 'name-za', label: 'Name: Z to A', icon: 'sort-alphabetical-descending' },
];

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Products' },
  { id: 'in-stock', label: 'In Stock Only' },
  { id: 'on-sale', label: 'On Sale' },
];

export const ProductFilter = ({ 
  sortBy, 
  filterBy, 
  onSortChange, 
  onFilterChange,
  productCount = 0 
}) => {
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const currentSort = SORT_OPTIONS.find(s => s.id === sortBy) || SORT_OPTIONS[0];
  const currentFilter = FILTER_OPTIONS.find(f => f.id === filterBy) || FILTER_OPTIONS[0];

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {/* Sort Button */}
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowSortModal(true)}
        >
          <MaterialCommunityIcons 
            name={currentSort.icon} 
            size={18} 
            color={theme.colors.text} 
          />
          <Text style={styles.filterButtonText}>{currentSort.label}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {/* Filter Button */}
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={18} color={theme.colors.text} />
          <Text style={styles.filterButtonText}>{currentFilter.label}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionItem,
                    sortBy === option.id && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    onSortChange(option.id);
                    setShowSortModal(false);
                  }}
                >
                  <MaterialCommunityIcons 
                    name={option.icon} 
                    size={20} 
                    color={sortBy === option.id ? theme.colors.primary : theme.colors.text} 
                  />
                  <Text style={[
                    styles.optionText,
                    sortBy === option.id && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {sortBy === option.id && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {FILTER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionItem,
                    filterBy === option.id && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    onFilterChange(option.id);
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    filterBy === option.id && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {filterBy === option.id && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  optionItemSelected: {
    backgroundColor: theme.colors.accent + '15',
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  optionTextSelected: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
});

export default ProductFilter;
