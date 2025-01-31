import { memo, useRef } from 'react'
import { useInfiniteQuery } from 'react-query'
import cx from 'classnames'

import { useAppSelector, useObserver } from 'hooks'
import { getDiseaseApi } from 'services/disease'
import { IItem } from 'types/search'
import { getItemIndex } from 'store/searchIndex'

import styles from '../Search.module.scss'
import { SearchIcon } from 'assets'
import HighlightText from './HighlightText'

const SuggestSearch = ({ query }: { query: string }) => {
  const index = useAppSelector(getItemIndex)
  const searchUrl = 'https://clinicaltrialskorea.com/studies?condition='
  const pageEndPointRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } = useInfiniteQuery(
    ['diseaseList', query],
    ({ pageParam = 1 }) => getDiseaseApi(query, pageParam),
    {
      refetchOnWindowFocus: false,
      enabled: !!query,
      staleTime: 6 * 10 * 1000,
      suspense: true,
      retryOnMount: false,
      useErrorBoundary: true,
      getNextPageParam: (lastPage) => {
        const { currentPage } = lastPage
        if (currentPage * 10 < lastPage.totalCount) return currentPage + 1
        return undefined
      },
    }
  )

  const onIntersect = ([entry]: any) => entry.isIntersecting && fetchNextPage()
  useObserver({
    target: pageEndPointRef,
    onIntersect,
    hasNextPage,
  })

  if (!isLoading && data!.pages[0].items.length === 0) return <span>{query} 검색 결과가 없습니다.</span>
  return (
    <>
      <span>추천 검색어</span>
      {data?.pages.map((page) =>
        page.items.map((item: IItem, i: number) => (
          <li key={item.sickCd} className={cx({ [styles.isFocus]: index === i })}>
            <SearchIcon />
            <a href={searchUrl + item.sickNm}>
              <HighlightText query={query} text={item.sickNm} />
            </a>
          </li>
        ))
      )}
      {hasNextPage && <div ref={pageEndPointRef} />}
      {isFetchingNextPage && <p>계속 불러오는 중 입니다.</p>}
    </>
  )
}

export default memo(SuggestSearch)
