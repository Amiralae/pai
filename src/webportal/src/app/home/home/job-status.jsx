// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import c from 'classnames';
import {isEmpty} from 'lodash';
import PropTypes from 'prop-types';
import querystring from 'querystring';
import {Icon, Stack, FontClassNames, ColorClassNames, DefaultButton, getTheme} from 'office-ui-fabric-react';
import React from 'react';

import Card from './card';
import {getHumanizedJobStateString} from '../../components/util/job';

import t from '../../components/tachyons.scss';

const StatusItem = ({className, icon, name, count, link}) => {
  const {spacing} = getTheme();
  return (
    <Stack
      styles={{root: [className]}}
      horizontal
      horizontalAlign='space-between'
      verticalAlign='center'
      padding='s1'
    >
      <Stack.Item>
        <div className={c(t.flex, t.itemsCenter, t.justifyStart)}>
          <div>
            <Icon className={ColorClassNames.neutralSecondary} iconName={icon} />
          </div>
          <div>
            <div className={c(ColorClassNames.neutralSecondary, FontClassNames.large)} style={{width: '10rem', marginLeft: spacing.m}}>
              {name}
            </div>
          </div>
          <div>
            <div className={c(FontClassNames.xLarge)} style={{marginLeft: spacing.l3}}>
              {count}
            </div>
          </div>
        </div>
      </Stack.Item>
      <Stack.Item>
        <DefaultButton
          text='View all'
          href={link}
        />
      </Stack.Item>
    </Stack>
  );
};

StatusItem.propTypes = {
  className: PropTypes.string,
  icon: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  link: PropTypes.string.isRequired,
};

const JobStatus = ({className, jobs}) => {
  let waiting = 0;
  let running = 0;
  let stopped = 0;
  let failed = 0;
  let succeeded = 0;
  if (!isEmpty(jobs)) {
    waiting = jobs.filter((x) => getHumanizedJobStateString(x) === 'Waiting').length;
    running = jobs.filter((x) => ['Running', 'Stopping'].includes(getHumanizedJobStateString(x))).length;
    stopped = jobs.filter((x) => getHumanizedJobStateString(x) === 'Stopped').length;
    failed = jobs.filter((x) => getHumanizedJobStateString(x) === 'Failed').length;
    succeeded = jobs.filter((x) => getHumanizedJobStateString(x) === 'Succeeded').length;
  }
  return (
    <Card className={className}>
      <Stack gap='l1'>
        <Stack.Item>
          <div className={FontClassNames.mediumPlus}>
            My job status
          </div>
        </Stack.Item>
        <Stack.Item>
          <Stack>
            <StatusItem
              className={c(t.bb, ColorClassNames.neutralQuaternaryBorder)}
              icon='Clock'
              name='Waiting'
              count={waiting}
              link={`/job-list.html?${querystring.stringify({
                status: 'Waiting',
                user: cookies.get('user'),
              })}`}
            />
            <StatusItem
              className={c(t.bb, ColorClassNames.neutralQuaternaryBorder)}
              icon='Running'
              name='Running'
              count={running}
              link={`/job-list.html?${querystring.stringify({
                status: 'Running',
                user: cookies.get('user'),
              })}`}
            />
            <StatusItem
              className={c(t.bb, ColorClassNames.neutralQuaternaryBorder)}
              icon='ErrorBadge'
              name='Stopped'
              count={stopped}
              link={`/job-list.html?${querystring.stringify({
                status: 'Stopped',
                user: cookies.get('user'),
              })}`}
            />
            <StatusItem
              className={c(t.bb, ColorClassNames.neutralQuaternaryBorder)}
              icon='Blocked'
              name='Failed'
              count={failed}
              link={`/job-list.html?${querystring.stringify({
                status: 'Failed',
                user: cookies.get('user'),
              })}`}
            />
            <StatusItem
              icon='Completed'
              name='Succeeded'
              count={succeeded}
              link={`/job-list.html?${querystring.stringify({
                status: 'Succeeded',
                user: cookies.get('user'),
              })}`}
            />
          </Stack>
        </Stack.Item>
      </Stack>
    </Card>
  );
};

JobStatus.propTypes = {
  className: PropTypes.string,
  jobs: PropTypes.array,
};

export default JobStatus;
