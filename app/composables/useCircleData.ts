import type { PeopleFile, Person } from '#shared/circle/types'
import { visiblePeople } from '#shared/circle/layout'
import peopleJson from '../../data/people.json'

export function useCircleData() {
  const data = peopleJson as PeopleFile
  const people = computed(() => visiblePeople(data.people))

  return {
    center: data.center,
    people,
    listed: computed(() => [...people.value].sort((a, b) => a.handle.localeCompare(b.handle))),
  }
}

export type { Person }
