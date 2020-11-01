import * as React from 'react';
import { module } from 'angular';
import { uniqWith, isEqual } from 'lodash';
import { react2angular } from 'react2angular';
import { IEcsServerGroupCommand } from '../../serverGroupConfiguration.service';
import { HelpField, TetheredSelect, withErrorBoundary } from '@spinnaker/core';
import { Alert } from 'react-bootstrap';
import { Option } from 'react-select';

export interface INetworkingProps {
  command: IEcsServerGroupCommand;
  notifyAngular: (key: string, value: any) => void;
  configureCommand: (query: string) => PromiseLike<void>;
}

interface INetworkingState {
  networkMode: string;
  networkModesAvailable: string[];
  subnetTypes: string[];
  subnetTypesAvailable: string[];
}

export class Networking extends React.Component<INetworkingProps, INetworkingState> {
  constructor(props: INetworkingProps) {
    super(props);
    const cmd = this.props.command;

    let defaultSubnetTypes: string[] = [];
    if (cmd.subnetTypes && cmd.subnetTypes.length > 0) {
      defaultSubnetTypes = cmd.subnetTypes;
    }
    defaultSubnetTypes.push(cmd.subnetType);
    cmd.subnetTypes = uniqWith(defaultSubnetTypes, isEqual);
    cmd.subnetType = '';
    /*eslint-disable no-console*/
    console.log('Constructor Subnet types: ' + cmd.subnetTypes);

    this.state = {
      networkMode: cmd.networkMode,
      networkModesAvailable: cmd.backingData ? cmd.backingData.networkModes : [],
      subnetTypes: cmd.subnetTypes,
      subnetTypesAvailable: cmd.backingData && cmd.backingData.filtered ? cmd.backingData.filtered.subnetTypes : [],
    };
  }

  public componentDidMount() {
    const cmd = this.props.command;

    this.props.configureCommand('1').then(() => {
      this.props.notifyAngular('subnetTypes', this.state.subnetTypes);
      this.setState({
        networkModesAvailable: cmd.backingData ? cmd.backingData.networkModes : [],
        subnetTypesAvailable: cmd.backingData && cmd.backingData.filtered ? cmd.backingData.filtered.subnetTypes : [],
      });
    });
  }

  private updateNetworkMode = (newNetworkMode: Option<string>) => {
    const updatedNetworkMode = newNetworkMode.value;
    this.props.notifyAngular('networkMode', updatedNetworkMode);
    this.setState({ networkMode: updatedNetworkMode });
  };

  private updateSubnetTypes = (newSubnetTypes: Option<string>) => {
    const updatedSubnetTypes = Array.isArray(newSubnetTypes) ? newSubnetTypes.map(subnetType => subnetType.value) : [];
    this.props.notifyAngular('subnetTypes', updatedSubnetTypes);
    this.setState({ subnetTypes: updatedSubnetTypes });
  };

  public render(): React.ReactElement<Networking> {
    const updateNetworkMode = this.updateNetworkMode;
    const updateSubnetTypes = this.updateSubnetTypes;

    const networkModesAvailable = this.state.networkModesAvailable.map(function(networkMode) {
      return { label: `${networkMode}`, value: networkMode };
    });

    const subnetTypesAvailable = this.state.subnetTypesAvailable.map(function(subnetType) {
      return { label: `${subnetType}`, value: subnetType };
    });

    const subnetTypeOptions = this.state.subnetTypesAvailable.length ? (
      <TetheredSelect
        multi={true}
        options={subnetTypesAvailable}
        value={this.state.subnetTypes}
        onChange={(e: Option) => {
          updateSubnetTypes(e as Option<string>);
        }}
        clearable={false}
      />
    ) : (
      <div className="sm-label-left">
        <Alert color="warning">No account was selected, or no subnet types are available for this account</Alert>
      </div>
    );

    return (
      <div className="networking-fluid form-horizontal">
        <div className="form-group">
          <div className="col-md-3 sm-label-right">
            <b>Network Mode</b>
            <HelpField id="ecs.networkMode" />
          </div>
          <div className="col-md-9" data-test-id="Networking.networkMode">
            <TetheredSelect
              placeholder="Select a network mode to use ..."
              options={networkModesAvailable}
              value={this.state.networkMode}
              onChange={(e: Option) => {
                updateNetworkMode(e as Option<string>);
              }}
              clearable={false}
            />
          </div>

          <div className="col-md-3 sm-label-right">
            <b>VPC Subnet</b>
            <HelpField key="ecs.subnet" />
          </div>
          <div className="col-md-9" data-test-id="Networking.subnetType">
            {subnetTypeOptions}
          </div>
        </div>
      </div>
    );
  }
}

export const NETWORKING_REACT = 'spinnaker.ecs.serverGroup.configure.wizard.networking.react';
module(NETWORKING_REACT, []).component(
  'networkingReact',
  react2angular(withErrorBoundary(Networking, 'networkingReact'), ['command', 'notifyAngular', 'configureCommand']),
);
