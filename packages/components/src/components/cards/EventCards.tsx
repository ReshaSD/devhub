import { Column, EnhancedGitHubEvent } from '@devhub/core'
import React, { useCallback, useMemo } from 'react'
import { View, ViewProps } from 'react-native'

import { useCardsKeyboard } from '../../hooks/use-cards-keyboard'
import { DataItemT, useCardsProps } from '../../hooks/use-cards-props'
import { useReduxState } from '../../hooks/use-redux-state'
import { BlurView } from '../../libs/blur-view/BlurView'
import { ErrorBoundary } from '../../libs/bugsnag'
import { OneList, OneListProps } from '../../libs/one-list'
import * as selectors from '../../redux/selectors'
import { sharedStyles } from '../../styles/shared'
import { EmptyCards, EmptyCardsProps } from './EmptyCards'
import { EventCard } from './EventCard'
import { SwipeableCard } from './SwipeableCard'

type ItemT = EnhancedGitHubEvent

export interface EventCardsProps {
  columnId: Column['id']
  errorMessage: EmptyCardsProps['errorMessage']
  fetchNextPage: (() => void) | undefined
  getItemByNodeIdOrId: (nodeIdOrId: string) => ItemT | undefined
  isShowingOnlyBookmarks: boolean
  itemNodeIdOrIds: string[]
  lastFetchSuccessAt: string | undefined
  pointerEvents?: ViewProps['pointerEvents']
  refresh: EmptyCardsProps['refresh']
  swipeable: boolean
}

export const EventCards = React.memo((props: EventCardsProps) => {
  const {
    columnId,
    errorMessage,
    fetchNextPage,
    getItemByNodeIdOrId,
    isShowingOnlyBookmarks,
    itemNodeIdOrIds,
    lastFetchSuccessAt,
    pointerEvents,
    refresh,
    swipeable,
  } = props

  const listRef = React.useRef<typeof OneList>(null)

  const getItemKey = useCallback(
    (nodeIdOrId: DataItemT, index: number) => {
      return `event-card-${nodeIdOrId || index}`
    },
    [getItemByNodeIdOrId],
  )

  const {
    OverrideRender,
    data,
    fixedHeaderComponent,
    footer,
    getItemSize,
    getOwnerIsKnownByItemOrNodeIdOrId,
    header,
    itemSeparator,
    onVisibleItemsChanged,
    refreshControl,
    repoIsKnown,
    safeAreaInsets,
    visibleItemIndexesRef,
  } = useCardsProps({
    columnId,
    fetchNextPage,
    getItemByNodeIdOrId,
    itemNodeIdOrIds,
    lastFetchSuccessAt,
    refresh,
    type: 'activity',
  })

  useCardsKeyboard(listRef, {
    columnId,
    getItemByNodeIdOrId,
    getOwnerIsKnownByItemOrNodeIdOrId,
    itemNodeIdOrIds:
      OverrideRender && OverrideRender.Component && OverrideRender.overlay
        ? []
        : itemNodeIdOrIds,
    repoIsKnown,
    type: 'activity',
    visibleItemIndexesRef,
  })

  const mainSubscription = useReduxState(
    useCallback(
      state =>
        selectors.createColumnSubscriptionSelector()(state, columnId || ''),
      [columnId],
    ),
  )

  const renderItem = useCallback<
    NonNullable<OneListProps<DataItemT>['renderItem']>
  >(
    ({ item: nodeIdOrId, index }) => {
      const height = getItemSize(nodeIdOrId, index)

      if (swipeable) {
        return (
          <View style={{ height }}>
            <SwipeableCard
              type="activity"
              columnId={columnId}
              nodeIdOrId={nodeIdOrId}
              ownerIsKnown={getOwnerIsKnownByItemOrNodeIdOrId(nodeIdOrId)}
              repoIsKnown={repoIsKnown}
            />
          </View>
        )
      }

      return (
        <ErrorBoundary>
          <View style={{ height }}>
            <EventCard
              repoIsKnown={repoIsKnown}
              ownerIsKnown={getOwnerIsKnownByItemOrNodeIdOrId(nodeIdOrId)}
              nodeIdOrId={nodeIdOrId}
              columnId={columnId}
            />
          </View>
        </ErrorBoundary>
      )
    },
    [getOwnerIsKnownByItemOrNodeIdOrId, repoIsKnown, swipeable],
  )

  const ListEmptyComponent = useMemo<
    NonNullable<OneListProps<DataItemT>['ListEmptyComponent']>
  >(
    () => () => {
      if (OverrideRender && OverrideRender.Component && OverrideRender.overlay)
        return null

      if (isShowingOnlyBookmarks) {
        return (
          <EmptyCards
            clearEmoji="bookmark"
            clearMessage="No bookmarks matching your filters"
            columnId={columnId}
            disableLoadingIndicator
            errorMessage={errorMessage}
            fetchNextPage={fetchNextPage}
            refresh={refresh}
          />
        )
      }

      return (
        <EmptyCards
          clearMessage="No activity"
          columnId={columnId}
          disableLoadingIndicator={
            !!(
              mainSubscription &&
              mainSubscription.data &&
              mainSubscription.data.lastFetchSuccessAt
            )
          }
          errorMessage={errorMessage}
          fetchNextPage={fetchNextPage}
          refresh={refresh}
        />
      )
    },
    [
      itemNodeIdOrIds.length ? undefined : columnId,
      itemNodeIdOrIds.length ? undefined : errorMessage,
      itemNodeIdOrIds.length ? undefined : fetchNextPage,
      itemNodeIdOrIds.length ? undefined : refresh,
      itemNodeIdOrIds.length ? undefined : isShowingOnlyBookmarks,
      itemNodeIdOrIds.length
        ? undefined
        : !!(
            OverrideRender &&
            OverrideRender.Component &&
            OverrideRender.overlay
          ),
    ],
  )

  if (OverrideRender && OverrideRender.Component && !OverrideRender.overlay)
    return <OverrideRender.Component />

  return (
    <View style={[sharedStyles.relative, sharedStyles.flex]}>
      {fixedHeaderComponent}

      <OneList
        ref={listRef}
        key="event-cards-list"
        ListEmptyComponent={ListEmptyComponent}
        containerStyle={
          OverrideRender && OverrideRender.Component && OverrideRender.overlay
            ? sharedStyles.superMuted
            : undefined
        }
        data={data}
        estimatedItemSize={getItemSize(data[0], 0) || 89}
        footer={footer}
        forceRerenderOnRefChange={getItemByNodeIdOrId}
        getItemKey={getItemKey}
        getItemSize={getItemSize}
        header={header}
        horizontal={false}
        itemSeparator={itemSeparator}
        onVisibleItemsChanged={onVisibleItemsChanged}
        overscanCount={1}
        pointerEvents={
          OverrideRender && OverrideRender.Component && OverrideRender.overlay
            ? 'none'
            : pointerEvents
        }
        refreshControl={refreshControl}
        renderItem={renderItem}
        safeAreaInsets={safeAreaInsets}
      />

      {!!(
        OverrideRender &&
        OverrideRender.Component &&
        OverrideRender.overlay
      ) && (
        <BlurView intensity={8} style={sharedStyles.absoluteFill}>
          <OverrideRender.Component />
        </BlurView>
      )}
    </View>
  )
})

EventCards.displayName = 'EventCards'
