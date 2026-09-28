import type { PeopleFile, PlacedPerson } from '#shared/circle/types'
import { filterForDisplay, groupByLayoutRing, placePeople } from '#shared/circle/ring-placement'
import peopleJson from '../../data/people.json'

export function useCircleData() {
  const data = peopleJson as PeopleFile
  const allPlaced = computed(() => placePeople(data.people))

  return {
    center: data.center,
    allPlaced,
    filterPlaced: (showUnfollowed: boolean, ringOnly: number | null) =>
      filterForDisplay(allPlaced.value, {
        showUnfollowed,
        ringOnly: ringOnly as PlacedPerson['layoutRing'] | null,
      }),
    groupByRing: (placed: PlacedPerson[]) => groupByLayoutRing(placed),
  }
}
