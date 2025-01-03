// plugins/prokodoCAT/admin/src/components/AuthorsList.tsx

import { type FC } from 'react';
import {
  Button,
  Flex,
  Grid,
  GridItem,
  Select,
} from '@strapi/design-system';
import { Plus, Trash } from '@strapi/icons';
import type { AuthorCategory } from '../../../../server/types/author';

export interface AuthorsListProps {
  authors: AuthorCategory[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, pair: AuthorCategory) => void;
  availableAuthors: { id: number; name: string }[];
  availableCategories: { id: number; name: string }[];
}

export const AuthorsList: FC<AuthorsListProps> = ({
  authors,
  onAdd,
  onRemove,
  onChange,
  availableAuthors,
  availableCategories,
}) => {
  return (
    <Flex direction="column" alignItems="stretch" gap={4}>
      {authors.map((pair, index) => (
        <Grid key={index} gap={4}>
          <GridItem col={6}>
            <Select
              label="Author"
              placeholder="Select an author"
              value={pair.authorId ? String(pair.authorId) : ''}
              onChange={(value: number) =>
                onChange(index, { ...pair, authorId: Number(value) })
              }
            >
              {availableAuthors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </Select>
          </GridItem>
          <GridItem col={5}>
            <Select
              label="Category (Optional)"
              placeholder="Select a category"
              value={pair.categoryId ? String(pair.categoryId) : ''}
              onChange={(value: number) =>
                onChange(index, { ...pair, categoryId: Number(value) })
              }
            >
              <option value="">None</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </GridItem>
          <GridItem col={1}>
            <Button
              variant="danger"
              onClick={() => onRemove(index)}
              aria-label="Remove author-category pair"
            >
              <Trash />
            </Button>
          </GridItem>
        </Grid>
      ))}
      <Button variant="tertiary" onClick={onAdd} startIcon={<Plus />}>
        Add Author
      </Button>
    </Flex>
  );
};
