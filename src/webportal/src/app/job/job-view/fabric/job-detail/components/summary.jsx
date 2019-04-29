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

import {FontClassNames, FontWeights, FontSizes} from '@uifabric/styling';
import c from 'classnames';
import {get, isEmpty, isNil} from 'lodash';
import {DateTime} from 'luxon';
import {ActionButton, DefaultButton, PrimaryButton} from 'office-ui-fabric-react/lib/Button';
import {Dropdown} from 'office-ui-fabric-react/lib/Dropdown';
import {Link} from 'office-ui-fabric-react/lib/Link';
import {MessageBar, MessageBarType} from 'office-ui-fabric-react/lib/MessageBar';
import PropTypes from 'prop-types';
import React from 'react';

import t from '../../tachyons.css';

import Card from './card';
import MonacoPanel from './monaco-panel';
import StatusBadge from './status-badge';
import Timer from './timer';
import {getJobMetricsUrl, cloneJob, openJobAttemptsPage} from '../conn';
import {printDateTime, getHumanizedJobStateString, getDurationString, isClonable} from '../util';
import { HoverCard } from 'office-ui-fabric-react';

const StoppableStatus = [
  'Running',
  'Waiting',
];

export default class Summary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      monacoProps: null,
      modalTitle: '',
      autoReloadInterval: 10 * 1000,
    };

    this.onChangeInterval = this.onChangeInterval.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.showApplicationSummary = this.showApplicationSummary.bind(this);
    this.showEditor = this.showEditor.bind(this);
    this.showJobConfig = this.showJobConfig.bind(this);
  }

  onChangeInterval(e, item) {
    this.setState({autoReloadInterval: item.key});
  }

  onDismiss() {
    this.setState({
      monacoProps: null,
      modalTitle: '',
    });
  }

  showEditor(title, props) {
    this.setState({
      monacoProps: props,
      modalTitle: title,
    });
  }

  showApplicationSummary() {
    const {jobInfo} = this.props;
    this.showEditor('Application Summary', {
      language: 'text',
      value: jobInfo.jobStatus.appExitDiagnostics || '',
    });
  }

  showJobConfig() {
    const {jobConfig} = this.props;
    this.showEditor('Job Config', {
      language: 'json',
      value: JSON.stringify(jobConfig, null, 2),
    });
  }

  renderHintMessage() {
    const {jobInfo} = this.props;
    if (!jobInfo) {
      return;
    }

    const state = getHumanizedJobStateString(jobInfo);
    if (state === 'Failed') {
      const diag = jobInfo.jobStatus.appExitDiagnostics;
      const code = jobInfo.jobStatus.appExitCode;
      if (code === 177) {
        // user code error
        let userExitCode;
        if (diag) {
          let match = diag.match(/<Raw>\[ExitCode\]: (\d+)/);
          if (match) {
            userExitCode = parseInt(match[1], 10);
          }
        }
        // container id
        let containerId;
        if (diag) {
          let match = diag.match(/^\s*"containerId"\s*:\s*"(.*?)",?\s*$/m);
          if (match) {
            containerId = match[1];
          }
        }

        return (
          <MessageBar messageBarType={MessageBarType.error}>
            <div>
              <div>
                <span className={c(t.w4, t.dib)} style={{fontWeight: FontWeights.semibold}}>
                  Error Type:
                </span>
                <span>User Error</span>
              </div>
              {containerId && (
                <div>
                  <span className={c(t.w4, t.dib)} style={{fontWeight: FontWeights.semibold}}>
                    Container ID:
                  </span>
                  <span>{containerId}</span>
                </div>
              )}
              {userExitCode && (
                <div>
                  <span className={c(t.w4, t.dib)} style={{fontWeight: FontWeights.semibold}}>
                    Exit Code:
                  </span>
                  <span>{userExitCode}</span>
                </div>
              )}
              <div>
                <span className={c(t.w4, t.dib)} style={{fontWeight: FontWeights.semibold}}>
                  Resolution:
                </span>
                <span>{`Please check container's Stdout and Stderr for more information.`}</span>
              </div>
            </div>
          </MessageBar>
        );
      } else {
        return (
          <MessageBar messageBarType={MessageBarType.error}>
            <div>
              <div>
                <span className={c(t.w4, t.dib)} style={{fontWeight: FontWeights.semibold}}>
                  Error Type:
                </span>
                <span>System Error</span>
              </div>
              <div>
                <span className={c(t.w4, t.dib)} style={{fontWeight: FontWeights.semibold}}>
                  Resolution:
                </span>
                <span>Please send the <Link onClick={this.showApplicationSummary}>application summary</Link> to your administrator for further investigation.</span>
              </div>
            </div>
          </MessageBar>
        );
      }
    } else if (state === 'Waiting') {
      const resourceRetries = get(jobInfo, 'jobStatus.retryDetails.resource');
      if (resourceRetries >= 3) {
        return (
          <MessageBar messageBarType={MessageBarType.warning}>
            <div>
              <div>
                <span className={c(t.w4, t.dib)} style={{fontWeight: FontWeights.semibold}}>
                  Error Type:
                </span>
                <span className={c(t.ml2)}>
                  Resource Conflicts
                </span>
              </div>
              <div>
                <span className={c(t.w4, t.dib)} style={{fontWeight: FontWeights.semibold}}>
                  Conflict Count:
                </span>
                <span className={c(t.ml2)}>
                  {resourceRetries}
                </span>
              </div>
              <div>
                <span className={c(t.w4, t.dib)} style={{fontWeight: FontWeights.semibold}}>
                  Resolution:
                </span>
                <span className={c(t.ml2)}>
                  Please adjust the resource requirement in your <Link onClick={this.showJobConfig}>job config</Link>, or wait till other jobs release more resources back to the system.
                </span>
              </div>
            </div>
          </MessageBar>
        );
      }
    }
  }
  render() {
    const {autoReloadInterval, modalTitle, monacoProps} = this.state;
    const {className, jobInfo, jobConfig, reloading, onStopJob, onReload} = this.props;
    const hintMessage = this.renderHintMessage();

    const wrapperStyle = {display: 'inline-block', verticalAlign: 'middle', width: '100%'};
    const messageBarType = {
      Waiting: MessageBarType.warning,
      Running: MessageBarType.success,
      Stopping: MessageBarType.severeWarning,
      Succeeded: MessageBarType.success,
      Failed: MessageBarType.remove,
      Stopped: MessageBarType.blocked,
    }[getHumanizedJobStateString(jobInfo)];
    
    const rootStyle = {backgroundColor: 'transparent'};
    const iconContainerStyle = {marginTop: 8, marginBottom: 8, marginLeft: 0};
    const iconStyle = {
      color: 'white', borderRadius: '50%', 
      backgroundColor: {
        Waiting: '#F9B61A',
        Running: '#579AE6',
        Stopping: '#579AE6',
        Succeeded: '#54D373',
        Failed: '#E06260',
        Stopped: '#B1B5B8',
      }[getHumanizedJobStateString(jobInfo)],
        transform: getHumanizedJobStateString(jobInfo) == 'Failed' ? 'rotate(90deg)' : 'rotate(0deg)',
    };
    /** @type {import('@uifabric/styling').IStyle} */
    const textStyle = {marginTop: 8, marginLeft: 4, marginRight: 8, marginBottom: 8, color: 'black'};
    return (
      <div className={className}>
        {/* summary */}
        <Card className={c(t.pv4)} style={{paddingLeft: 32, paddingRight: 32, paddingTop: 20, paddingBottom: 20, marginBottom: 16}}>
          {/* summary-row-1 */}
          <div className={c(t.flex, t.justifyBetween, t.itemsCenter)}>
            <div
              className={c(t.truncate)}
              style={{
                fontSize: FontSizes.xxLarge,
                fontWeight: FontWeights.regular,
              }}
            >
              {jobInfo.name}
            </div>
            <div className={c(t.flex, t.itemsCenter)}>
              <Dropdown
                styles={{
                  title: [FontClassNames.mediumPlus, {border: 0}],
                }}
                dropdownWidth={180}
                selectedKey={autoReloadInterval}
                onChange={this.onChangeInterval}
                options={[
                  {key: 0, text: 'Disable Auto Refresh'},
                  {key: 10000, text: 'Refresh every 10s'},
                  {key: 30000, text: 'Refresh every 30s'},
                  {key: 60000, text: 'Refresh every 60s'},
                ]}
              />
              <ActionButton
                className={t.ml2}
                styles={{root: [FontClassNames.mediumPlus]}}
                iconProps={{iconName: 'Refresh'}}
                disabled={reloading}
                onClick={onReload}
              >
                Refresh
              </ActionButton>
            </div>
          </div>
          {/* summary-row-2 */}
          <div className={c(t.mt4, t.flex, t.itemsStart)} 
                style={{marginTop: 20}}>
            <div>
              <div className={c(t.gray, FontClassNames.medium)}>Status</div>
              <div className={c(t.mt2)} style={{marginTop: 16,}}>
                <StatusBadge status={getHumanizedJobStateString(jobInfo)}/>
              </div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.medium)}>Start Time</div>
              <div className={c(t.mt2, FontClassNames.mediumPlus)} style={{marginTop: 16}}>
                {printDateTime(DateTime.fromMillis(jobInfo.jobStatus.createdTime))}
              </div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.medium)}>User</div>
              <div className={c(t.mt2, FontClassNames.mediumPlus)} style={{marginTop: 16}}>
                {jobInfo.jobStatus.username}
              </div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.medium)}>Virtual Cluster</div>
              <div className={c(t.mt2, FontClassNames.mediumPlus)} style={{marginTop: 16}}>
                {jobInfo.jobStatus.virtualCluster}
              </div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.medium)}>Duration</div>
              <div className={c(t.mt2, FontClassNames.mediumPlus)} style={{marginTop: 16}}>
                {getDurationString(jobInfo)}
              </div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.medium)}>Retries</div>
              <Link
                className={c(t.mt2, FontClassNames.mediumPlus)} style={{marginTop: 16}}
                onClick={() => openJobAttemptsPage(jobInfo.jobStatus.retries)}
                disabled={isNil(jobInfo.jobStatus.retries)}
              >
                {jobInfo.jobStatus.retries}
              </Link>
            </div>
          </div>
          {/* summary-row-2.5 error info */}
          {hintMessage && (
            <div className={t.mt4}>
              {hintMessage}
            </div>
          )}
          {/* summary-row-3 */}
          <div className={c(t.mt4, t.flex, t.justifyBetween, t.itemsCenter)}>
            <div className={c(t.flex)}>
              <Link
                styles={{root: [FontClassNames.mediumPlus]}}
                href='#'
                disabled={isNil(jobConfig)}
                onClick={this.showJobConfig}
              >
                View Job Config
              </Link>
              <div className={c(t.bl, t.mh3)} style={{marginLeft: 16, marginRight: 16}}></div>
              <Link
                styles={{root: [FontClassNames.mediumPlus]}}
                href='#'
                disabled={isEmpty(jobInfo.jobStatus.appExitDiagnostics)}
                onClick={this.showApplicationSummary}
              >
                View Application Summary
              </Link>
              <div className={c(t.bl, t.mh3)} style={{marginLeft: 16, marginRight: 16}}></div>
              <Link
                styles={{root: [FontClassNames.mediumPlus]}}
                href={jobInfo.jobStatus.appTrackingUrl}
                target="_blank"
              >
                Go to Application Tracking Page
              </Link>
              <div className={c(t.bl, t.mh3)} style={{marginLeft: 16, marginRight: 16}}></div>
              <Link
                styles={{root: [FontClassNames.mediumPlus]}}
                href={getJobMetricsUrl()}
                target="_blank"
              >
                Go to Job Metrics Page
              </Link>
            </div>
            <div>
              <PrimaryButton
                text='Clone'
                onClick={() => cloneJob(jobConfig)}
                disabled={!isClonable(jobConfig)}
              />
              <DefaultButton
                className={c(t.ml3)}
                style={{marginLeft: 8}}
                text='Stop'
                onClick={onStopJob}
                disabled={!StoppableStatus.includes(getHumanizedJobStateString(jobInfo))}
              />
            </div>
          </div>
          {/* Monaco Editor Modal */}
          <MonacoPanel
            isOpen={!isNil(monacoProps)}
            onDismiss={this.onDismiss}
            title={modalTitle}
            monacoProps={monacoProps}
          />
          {/* Timer */}
          <Timer interval={autoReloadInterval === 0 ? null : autoReloadInterval} func={onReload} />
        </Card>
      </div>
    );
  }
}
Summary.propTypes = {
  className: PropTypes.string,
  jobInfo: PropTypes.object.isRequired,
  jobConfig: PropTypes.object,
  reloading: PropTypes.bool.isRequired,
  onStopJob: PropTypes.func.isRequired,
  onReload: PropTypes.func.isRequired,
};
