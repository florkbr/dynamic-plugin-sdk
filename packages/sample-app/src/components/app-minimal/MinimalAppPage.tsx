import { useExtensions, useResolvedExtensions } from '@openshift/dynamic-plugin-sdk';
import type { LoadedExtension } from '@openshift/dynamic-plugin-sdk';
import { isModelFeatureFlag, isTelemetryListener } from '@openshift/dynamic-plugin-sdk-extensions';
import { Card, CardBody, Flex, FlexItem, Gallery, GalleryItem } from '@patternfly/react-core';
import { truncate } from 'lodash';
import * as React from 'react';
import FeatureFlagTable from '../common/FeatureFlagTable';
import LabelWithTooltipIcon from '../common/LabelWithTooltipIcon';
import PluginInfoTable from '../common/PluginInfoTable';

type ExtensionGalleryProps = {
  extensions: LoadedExtension[];
};

const ExtensionGallery: React.FC<ExtensionGalleryProps> = ({ extensions }) => (
  <Gallery hasGutter>
    {extensions.map((e) => (
      <GalleryItem key={e.uid}>
        <Card isCompact>
          <CardBody>
            <LabelWithTooltipIcon label={e.type} tooltipContent={truncate(e.uid)} />
          </CardBody>
        </Card>
      </GalleryItem>
    ))}
  </Gallery>
);

/**
 * This is an example on how to consume extensions contributed by plugins.
 *
 * The `useExtensions` hook returns extensions which are currently in use, without any further
 * transformations. Its argument is a predicate function that filters extensions based on their
 * `type`.
 *
 * The `useResolvedExtensions` hook extends the `useExtensions` functionality by transforming
 * the properties of matching extensions, resolving all `CodeRef<T>` functions into `T` values.
 * This resolution is inherently asynchronous, so the hook provides the `resolved` flag which
 * indicates the completion of the code reference resolution.
 */
const TestExtensions: React.FC = () => {
  const extensions = useExtensions(isModelFeatureFlag);
  const [resolvedExtensions, resolved] = useResolvedExtensions(isTelemetryListener);
  return resolved ? <ExtensionGallery extensions={[...extensions, ...resolvedExtensions]} /> : null;
};

const MinimalAppPage: React.FC = () => (
  <Flex direction={{ default: 'column' }}>
    <FlexItem>
      <PluginInfoTable />
    </FlexItem>
    <FlexItem>
      <FeatureFlagTable />
    </FlexItem>
    <FlexItem>
      <TestExtensions />
    </FlexItem>
  </Flex>
);

export default MinimalAppPage;
