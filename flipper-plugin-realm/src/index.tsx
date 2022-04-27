import React, { useRef } from "react";
import {
  PluginClient,
  createState,
  usePlugin,
  useValue,
  MasterDetail,
} from "flipper-plugin";

type Events = {
  newRow: Row;
  collection: CollectionData
};

type Row = {
  id: number;
  title: string;
  url: string;
};

type CollectionData = {
  name: string,
  collection: unknown[]
}

export function plugin(client: PluginClient<Events, {}>) {
  const rows = createState<any[]>([], { persist: "rows" });
  const collections = createState<Record<string, unknown[]>>({}, { persist: "collections" })
  const selectedId = createState<string | null>(null, { persist: "selection" });

  client.onMessage("newRow", (row) => {
    rows.update((draft) => {
      draft.push(row)
    });
  });

  client.onMessage("collection", (collectionData) => {
    collections.update((draft) => {
      draft[collectionData.name] = collectionData.collection
    })
  })

  function setSelection(id: number) {
    selectedId.set("" + id);
  }

  return { rows, collections, selectedId, setSelection };
}

type Column = {
  key: string,
  width: number
}

export function Component() {
  const instance = usePlugin(plugin);
  const collections = useValue(instance.collections);
  return (
    <>
      {Object.keys(collections).map(key => {
        return <CollectionTable key={key} title={key} collection={collections[key]} />
      })}
    </>
  )
}

type CollectionTableProps = {
  title: string,
  collection: any[]
}

const CollectionTable: React.FC<CollectionTableProps> = ({ title, collection }) => {
  const columns = useRef<Column[]>([])
  if (collection.length > 0 && columns.current.length === 0) {
    columns.current = Object.keys(collection[0]).sort((a, b) => {
      if (a == b) {
        return 0
      }
      else if (a < b) {
        return -1
      }
      return 1
    }
    ).map(rowKey => {
      return {
        key: rowKey,
        width: 100
      }
    })
  }

  if (collection.length === 0 || !columns.current) {
    return <>
      <h1>{title}</h1>
      <p>No Data</p>
    </>
  }

  return (
    <>
      <h1>{title}</h1>
      <MasterDetail records={collection} columns={columns.current} />
    </>
  );

}
