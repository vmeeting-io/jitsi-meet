import _debounce from 'lodash/debounce';
import React, { Component } from 'react';

import MultiSelect from '../../../ui/components/web/MultiSelect';
import logger from '../../logger';

import InlineDialogFailure from './InlineDialogFailure';

/**
 * A MultiSelect that is also auto-completing.
 */
class MultiSelectAutocomplete extends Component {
    /**
     * Initializes a new {@code MultiSelectAutocomplete} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        const defaultValue = this.props.defaultValue || [];

        this.state = {
            isOpen: false,
            filterValue: '',
            loading: false,
            error: false,
            items: [],
            selectedItems: [ ...defaultValue ]
        };

        this._onFilterChange = this._onFilterChange.bind(this);
        this._onRetry = this._onRetry.bind(this);
        this._onSelectionChange = this._onSelectionChange.bind(this);
        this._sendQuery = _debounce(this._sendQuery.bind(this), 200);
    }

    /**
     * Sets the items to display as selected.
     *
     * @param {Array<MultiSelectItem>} selectedItems - The list of items to display as
     * having been selected.
     * @returns {void}
     */
    setSelectedItems(selectedItems = []) {
        this.setState({ selectedItems });
    }

    /**
     * Renders the content of this component.
     *
     * @returns {ReactElement}
     */
    render() {
        const autoFocus = this.props.shouldFocus || false;
        const disabled = this.props.isDisabled || false;
        const placeholder = this.props.placeholder || '';
        const noMatchesFound = this.state.loading ? this.props.loadingMessage : this.props.noMatchesFound || '';
        const errorDialog = this._renderError();

        return (
            <div>
                <MultiSelect
                    autoFocus = { autoFocus }
                    disabled = { disabled }
                    error = { this.state.error }
                    errorDialog = { errorDialog }
                    filterValue = { this.state.filterValue }
                    id = { this.props.id }
                    isOpen = { this.state.isOpen }
                    items = { this.state.items }
                    noMatchesText = { noMatchesFound }
                    onFilterChange = { this._onFilterChange }
                    onRemoved = { this._onSelectionChange }
                    onSelected = { this._onSelectionChange }
                    placeholder = { placeholder }
                    selectedItems = { this.state.selectedItems } />
            </div>
        );
    }


    /**
     * Sets the state and sends a query on filter change.
     *
     * @param {string} filterValue - The filter text value.
     * @private
     * @returns {void}
     */
    _onFilterChange(filterValue: string) {
        this.setState({
            // Clean the error if the filterValue is empty.
            error: this.state.error && Boolean(filterValue),
            filterValue,
            isOpen: Boolean(this.state.items.length) && Boolean(filterValue),
            items: [],
            loading: Boolean(filterValue)
        });
        if (filterValue) {
            this._sendQuery(filterValue);
        }
    }

    /**
     * Retries the query on retry.
     *
     * @private
     * @returns {void}
     */
    _onRetry() {
        this._sendQuery(this.state.filterValue);
    }

    /**
     * Updates the selected items when a selection event occurs.
     *
     * @param {any} item - The selected item.
     * @private
     * @returns {void}
     */
    _onSelectionChange(item: any) {
        const existing
            = this.state.selectedItems.find((k: any) => k.value === item.value);
        let selectedItems = this.state.selectedItems;

        if (existing) {
            selectedItems = selectedItems.filter(k => k !== existing);
        } else {
            selectedItems.push(this.props.onItemSelected(item));
        }
        this.setState({
            isOpen: false,
            selectedItems
        });

        if (this.props.onSelectionChange) {
            this.props.onSelectionChange(selectedItems);
        }
    }

    /**
     * Renders the error UI.
     *
     * @returns {ReactElement|null}
     */
    _renderError() {
        if (!this.state.error) {
            return null;
        }

        return (

            <InlineDialogFailure
                onRetry = { this._onRetry }
                showSupportLink = { this.props.showSupportLink } />
        );
    }

    /**
     * Sends a query to the resourceClient.
     *
     * @param {string} filterValue - The string to use for the search.
     * @returns {void}
     */
    _sendQuery(filterValue: string) {
        if (!filterValue) {
            return;
        }

        this.setState({
            error: false
        });

        const resourceClient = this.props.resourceClient || {
            makeQuery: () => Promise.resolve([]),
            parseResults: (results: any) => results
        };

        resourceClient.makeQuery(filterValue)
            .then((results: any) => {
                if (this.state.filterValue !== filterValue) {
                    this.setState({
                        error: false
                    });

                    return;
                }

                this.setState({
                    items: resourceClient.parseResults(results),
                    isOpen: true,
                    loading: false,
                    error: false
                });
            })
            .catch((error) => {
                logger.error('MultiSelectAutocomplete error in query', error);

                this.setState({
                    error: true,
                    loading: false,
                    isOpen: false
                });
            });
    }
}

export default MultiSelectAutocomplete;
