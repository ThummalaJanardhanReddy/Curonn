import React, { useState, useEffect } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { images } from '../../../assets';
import axiosClient from '../../../src/api/axiosClient';
import ApiRoutes from '../../../src/api/employee/employee';
import BackButton from '../../shared/components/BackButton';
import { colors } from '../../shared/styles/commonStyles';
import {
  getResponsiveFontSize,
  getResponsiveSpacing
} from '../../shared/utils/responsive';
import { fontStyles, fonts } from "../../shared/styles/fonts";

interface HealthFeedItem {
  id: string;
  titleName: string;
  descriptionName: string;
  authorName?: string;
  date?: string;
  categoryName?: string;
  readTime?: string;
  thumbnailImag?: string;
  isBookmarked?: boolean;
}

interface HealthFeedScreenProps {
  onClose?: () => void;
}

export default function HealthFeedScreen({ onClose }: HealthFeedScreenProps) {
  const [healthFeeds, setHealthFeeds] = useState<HealthFeedItem[]>([]);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await axiosClient.get(ApiRoutes.ArticlesData.Allarticles);
        if (Array.isArray(res)) {
          // Add isBookmarked default property for UI
          setHealthFeeds(res.map((item: any) => ({ ...item, isBookmarked: false })));
        }
      } catch (e) {
        console.error('Failed to fetch articles', e);
      }
    }
    fetchArticles();
  }, []);

  const [selectedArticle, setSelectedArticle] = useState<HealthFeedItem | null>(null);

  const handleBack = () => {
    if (onClose) {
      onClose();
    }
  };

  const toggleBookmark = (id: string) => {
    setHealthFeeds(prev => 
      prev.map(feed => 
        feed.id === id 
          ? { ...feed, isBookmarked: !feed.isBookmarked }
          : feed
      )
    );
  };

  const handleArticleClick = (article: HealthFeedItem) => {
    setSelectedArticle(article);
  };

  const closeArticleView = () => {
    setSelectedArticle(null);
  };

  const renderHealthFeedItem = ({ item }: { item: HealthFeedItem }) => (
    <TouchableOpacity 
      style={styles.feedItem}
      onPress={() => handleArticleClick(item)}
      activeOpacity={0.8}
    >
      <View style={styles.feedImageContainer}>
        <Image 
          source={item.thumbnailImag ? { uri: item.thumbnailImag } : images.healthArticle} 
          style={styles.feedImage}
          resizeMode="cover"
        />
        {/* <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.categoryName || ''}</Text>
        </View> */}
      </View>
      
      <View style={styles.feedContent}>
        <Text style={styles.feedTitle}>{item.titleName}</Text>
        <Text style={styles.feedDescription} numberOfLines={3}>
          {item.descriptionName}
        </Text>
        
        {/* <View style={styles.feedMeta}>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{item.authorName || ''}</Text>
            <Text style={styles.feedDate}>• {item.date || ''}</Text>
            <Text style={styles.readTime}>• {item.readTime || ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleBookmark(item.id);
            }}
          >
            <Text style={styles.bookmarkIcon}>
              {item.isBookmarked ? '🔖' : '📖'}
            </Text>
          </TouchableOpacity>
        </View> */}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton
            title=""
            onPress={handleBack}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Health Feed</Text>
        </View>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.closeButton}
        >
          <Image source={images.icons.close} style={styles.closeIcon} />
        </TouchableOpacity>
      </View>


      {/* Health Feeds */}
      <ScrollView style={styles.feedsContainer} showsVerticalScrollIndicator={false}>
        {healthFeeds.map((item) => (
          <View key={item.id} style={styles.feedItemWrapper}>
            {renderHealthFeedItem({ item })}
          </View>
        ))}
      </ScrollView>

      {/* Full Article View Modal */}
      {selectedArticle && (
        <View style={styles.articleModalOverlay}>
          <View style={styles.articleModalContent}>
            <View style={[styles.articleHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
              <Text 
                style={styles.articleTitle} 
                numberOfLines={2} 
                ellipsizeMode="tail"
              >
                {selectedArticle.titleName}
              </Text>
              <TouchableOpacity
                onPress={closeArticleView}
                style={styles.articleCloseButton}
              >
                <Image source={images.icons.close} style={styles.articleCloseIcon} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.articleBody} showsVerticalScrollIndicator={true}>
              <View style={styles.articleImageContainer}>
                <Image 
                  source={selectedArticle.thumbnailImag ? { uri: selectedArticle.thumbnailImag } : images.healthArticle} 
                  style={styles.articleImage}
                  resizeMode="cover"
                />
                {/* <View style={styles.articleCategoryBadge}>
                  <Text style={styles.articleCategoryText}>{selectedArticle.categoryName || ''}</Text>
                </View> */}
              </View>
              <View style={styles.articleContent}>
{/*                 
                <View style={styles.articleMeta}>
                  <Text style={styles.articleAuthor}>{selectedArticle.authorName ? `By ${selectedArticle.authorName}` : ''}</Text>
                  <Text style={styles.articleDate}>{selectedArticle.date || ''}</Text>
                  <Text style={styles.articleReadTime}>{selectedArticle.readTime || ''}</Text>
                </View> */}
                <Text style={styles.articleFullContent}>
                  {selectedArticle.descriptionName}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(10),
    paddingBottom: getResponsiveSpacing(15),
    backgroundColor: '#fff',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: colors.black,
    marginLeft: getResponsiveSpacing(12),
  },
  closeButton: {
    padding: getResponsiveSpacing(8),
  },
  closeIcon: {
    width: getResponsiveSpacing(20),
    height: getResponsiveSpacing(20),
    tintColor: colors.textSecondary,
  },
  feedsContainer: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing(20),
  },
  feedItemWrapper: {
    marginBottom: getResponsiveSpacing(20),
  },
  feedItem: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedImageContainer: {
    position: 'relative',
    height: getResponsiveSpacing(200),
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: getResponsiveSpacing(12),
    left: getResponsiveSpacing(12),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: getResponsiveSpacing(8),
    paddingVertical: getResponsiveSpacing(4),
    borderRadius: getResponsiveSpacing(12),
  },
  categoryText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(12),
    fontWeight: '600',
  },
  feedContent: {
    padding: getResponsiveSpacing(16),
  },
  feedTitle: {
    fontSize: getResponsiveFontSize(18),
    color: colors.text,
    marginBottom: getResponsiveSpacing(8),
    lineHeight: getResponsiveFontSize(24),
     fontFamily: fonts.semiBold,
  },
  feedDescription: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    lineHeight: getResponsiveFontSize(20),
    marginBottom: getResponsiveSpacing(12),
     fontFamily: fonts.regular,
  },
  feedMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: '600',
    color: colors.primary,
  },
  feedDate: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
    marginLeft: getResponsiveSpacing(4),
  },
  readTime: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
    marginLeft: getResponsiveSpacing(4),
  },
  bookmarkButton: {
    padding: getResponsiveSpacing(8),
  },
  bookmarkIcon: {
    fontSize: getResponsiveFontSize(20),
  },
  // Article Modal Styles
  articleModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  articleModalContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: getResponsiveSpacing(20),
    borderTopRightRadius: getResponsiveSpacing(20),
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: getResponsiveSpacing(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: getResponsiveSpacing(10),
  },
  articleCloseButton: {
    padding: getResponsiveSpacing(8),
  },
  articleCloseIcon: {
    width: getResponsiveSpacing(20),
    height: getResponsiveSpacing(20),
    tintColor: colors.textSecondary,
  },
  articleBody: {
    flex: 1,
  },
  articleImageContainer: {
    position: 'relative',
    height: getResponsiveSpacing(200),
    paddingHorizontal: getResponsiveSpacing(10),
  },
  articleImage: {
    width: '100%',
    height: '100%',
    borderRadius: getResponsiveSpacing(12),
  },
  articleCategoryBadge: {
    position: 'absolute',
    top: getResponsiveSpacing(16),
    left: getResponsiveSpacing(16),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(6),
    borderRadius: getResponsiveSpacing(16),
  },
  articleCategoryText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
  },
  articleContent: {
    paddingHorizontal: getResponsiveSpacing(16),
    marginTop: getResponsiveSpacing(16),
  },
  articleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: getResponsiveFontSize(32),
    fontFamily: fonts.semiBold,
    marginTop: getResponsiveSpacing(5),
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(24),
    flexWrap: 'wrap',
  },
  articleAuthor: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    color: colors.primary,
    marginRight: getResponsiveSpacing(8),
  },
  articleDate: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    marginRight: getResponsiveSpacing(8),
  },
  articleReadTime: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
  },
  articleFullContent: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    lineHeight: getResponsiveFontSize(24),
    marginBottom: getResponsiveSpacing(30),
    fontFamily: fonts.regular,
  },
});
