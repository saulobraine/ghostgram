// FloatingPanel - Collapsible floating panel component (Vanilla JS)
import { createElement, clearElement, replaceChildren } from '../utils/DOMRenderer.js';
import { Logo } from './Logo.js';
import { i18nService } from '../utils/I18nService.js';

export class FloatingPanel {
  constructor(props) {
    this.props = props;
    this.element = null;
    // Element references for incremental updates
    this._refs = {
      badge: null,
      statusBadge: null,
      content: null,
      statusIndicator: null,
      statusText: null,
      startScanButton: null,
      scanningProgress: null,
      scanningPercentage: null,
      scanningProgressBar: null,
      scanningPauseButton: null,
      unfollowingProgress: null,
      unfollowingPercentage: null,
      unfollowingProgressBar: null,
      unfollowingPauseButton: null,
      usersFoundStat: null,
      usersFoundValue: null,
      usersSelectedStat: null,
      usersSelectedValue: null,
      copyListButton: null,
      emptyMessage: null
    };
  }

  /**
   * Translation helper
   * @param {string} key - Translation key
   * @param {Object} vars - Variables for interpolation
   * @returns {string}
   */
  _t(key, vars = {}) {
    // i18n should already be initialized by the entry point
    // If not ready, i18nService.t() will return the key
    return i18nService.t(key, vars);
  }

  /**
   * Update text content of an element
   * @param {HTMLElement} element - Element to update
   * @param {string} text - New text content
   */
  _updateText(element, text) {
    if (element && element.textContent !== text) {
      element.textContent = text;
    }
  }

  /**
   * Update or create element conditionally
   * @param {HTMLElement} parent - Parent element
   * @param {string} refKey - Key in this._refs
   * @param {Function} createFn - Function to create element
   * @param {Function} updateFn - Function to update element
   * @param {boolean} shouldExist - Whether element should exist
   */
  _updateOrCreateElement(parent, refKey, createFn, updateFn, shouldExist) {
    const existing = this._refs[refKey];

    if (shouldExist) {
      if (existing && existing.parentNode === parent) {
        // Update existing element
        if (updateFn) updateFn(existing);
      } else {
        // Create new element
        if (existing && existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }
        const newElement = createFn();
        this._refs[refKey] = newElement;
        parent.appendChild(newElement);
      }
    } else {
      // Remove element if it exists
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
        this._refs[refKey] = null;
      }
    }
  }

  /**
   * Render the component
   * @returns {HTMLElement} Root element
   */
  render() {
    if (typeof document === 'undefined') {
      // Return empty div if document is not available
      if (!this.element) {
        this.element = createElement('div');
      }
      return this.element;
    }

    const {
      isExpanded,
      onToggle,
      scanningState,
      unfollowingState,
      extensionEnabled,
      onStartScan,
      onCopyList,
      selectedResultsCount = 0
    } = this.props;

    const isScanning = scanningState?.status?.isScanning?.() || false;
    const isPaused = scanningState?.status?.isPaused?.() || false;
    const isCompleted = scanningState?.status?.isCompleted?.() || false;
    const isUnfollowing = unfollowingState?.status?.isUnfollowing?.() || false;
    const isInitial = scanningState?.status?.isInitial?.() || false;
    const percentage = scanningState?.percentage || 0;
    const resultsCount = scanningState?.results?.length || 0;

    // Calculate badge count (users found or selected)
    const badgeCount = (isScanning || isPaused || isCompleted) ? resultsCount : selectedResultsCount;

    // Create or update root element
    if (!this.element) {
      this.element = createElement('div', {
        className: `floating-panel ${isExpanded ? 'floating-panel--expanded' : 'floating-panel--collapsed'}`
      });
      this._renderInitial();
    } else {
      // Update className
      this.element.className = `floating-panel ${isExpanded ? 'floating-panel--expanded' : 'floating-panel--collapsed'}`;
      const isPausedState = scanningState?.status?.isPaused?.() || false;
      const isCompletedState = scanningState?.status?.isCompleted?.() || false;
      this._updateExisting(badgeCount, isExpanded, isScanning, isPausedState, isCompletedState, isUnfollowing, isInitial,
        percentage, resultsCount, selectedResultsCount, extensionEnabled,
        unfollowingState, onStartScan, onCopyList);
    }

    return this.element;
  }

  /**
   * Render initial structure
   * @private
   */
  _renderInitial() {
    const {
      isExpanded,
      onToggle,
      scanningState,
      unfollowingState,
      extensionEnabled,
      onStartScan,
      onCopyList,
      selectedResultsCount = 0
    } = this.props;

    const isScanning = scanningState?.status?.isScanning?.() || false;
    const isPaused = scanningState?.status?.isPaused?.() || false;
    const isCompleted = scanningState?.status?.isCompleted?.() || false;
    const isUnfollowing = unfollowingState?.status?.isUnfollowing?.() || false;
    const isInitial = scanningState?.status?.isInitial?.() || false;
    const percentage = scanningState?.percentage || 0;
    const resultsCount = scanningState?.results?.length || 0;
    const badgeCount = (isScanning || isPaused || isCompleted) ? resultsCount : selectedResultsCount;

    // Toggle button
    const toggleButton = createElement('button', {
      className: 'floating-panel__toggle',
      onClick: onToggle,
      ariaLabel: isExpanded ? this._t('floatingPanel.collapse') : this._t('floatingPanel.expand'),
      title: isExpanded ? this._t('floatingPanel.collapse') : this._t('floatingPanel.expand')
    },
      createElement('div', { className: 'floating-panel__icon' }, Logo())
    );

    // Badge
    if (badgeCount > 0) {
      const badge = createElement('span', { className: 'floating-panel__badge' }, badgeCount);
      this._refs.badge = badge;
      toggleButton.appendChild(badge);
    }

    // Status badge
    if (!extensionEnabled) {
      const statusBadge = createElement('span', {
        className: 'floating-panel__status-badge floating-panel__status-badge--disabled',
        title: this._t('floatingPanel.extensionDisabled')
      }, '⚠');
      this._refs.statusBadge = statusBadge;
      toggleButton.appendChild(statusBadge);
    }

    this.element.appendChild(toggleButton);

    // Expanded content
    if (isExpanded) {
      const content = this._createContent(isScanning, isPaused, isCompleted, isUnfollowing, isInitial, percentage,
        resultsCount, selectedResultsCount, extensionEnabled,
        unfollowingState, onStartScan, onCopyList);
      this._refs.content = content;
      this.element.appendChild(content);
    }
  }

  /**
   * Create content element
   * @private
   */
  _createContent(isScanning, isPaused, isCompleted, isUnfollowing, isInitial, percentage, resultsCount,
    selectedResultsCount, extensionEnabled, unfollowingState, onStartScan, onCopyList) {
    const content = createElement('div', { className: 'floating-panel__content' },
      // Header
      createElement('div', { className: 'floating-panel__header' },
        createElement('h3', { className: 'floating-panel__title' }, this._t('floatingPanel.title')),
        createElement('button', {
          className: 'floating-panel__close',
          onClick: this.props.onToggle,
          ariaLabel: this._t('floatingPanel.collapse'),
          title: this._t('floatingPanel.collapse')
        }, '×')
      ),
      // Body
      this._createBody(isScanning, isPaused, isCompleted, isUnfollowing, isInitial, percentage, resultsCount,
        selectedResultsCount, extensionEnabled, unfollowingState, onStartScan, onCopyList)
    );
    return content;
  }

  /**
   * Create body element
   * @private
   */
  _createBody(isScanning, isPaused, isCompleted, isUnfollowing, isInitial, percentage, resultsCount,
    selectedResultsCount, extensionEnabled, unfollowingState, onStartScan, onCopyList) {
    const body = createElement('div', { className: 'floating-panel__body' });

    // Extension Status
    const statusIndicator = createElement('span', {
      className: `floating-panel__status-indicator ${extensionEnabled ? 'floating-panel__status-indicator--enabled' : 'floating-panel__status-indicator--disabled'}`
    }, extensionEnabled ? '●' : '○');
    this._refs.statusIndicator = statusIndicator;

    const statusText = createElement('span', { className: 'floating-panel__status-text' },
      extensionEnabled ? this._t('floatingPanel.extensionEnabled') : this._t('floatingPanel.extensionDisabled')
    );
    this._refs.statusText = statusText;

    body.appendChild(createElement('div', { className: 'floating-panel__status' },
      statusIndicator,
      statusText
    ));

    // Start Scan Button
    if (isInitial && extensionEnabled) {
      const startScanButton = createElement('button', {
        className: 'floating-panel__button floating-panel__button--primary',
        onClick: onStartScan
      }, this._t('floatingPanel.startScan'));
      this._refs.startScanButton = startScanButton;
      body.appendChild(startScanButton);
    }

    // Scanning Progress (show for scanning, paused, or completed)
    if (isScanning || isPaused || isCompleted) {
      const scanningProgress = this._createScanningProgress(percentage);
      this._refs.scanningProgress = scanningProgress;
      // Hide pause button if completed
      if (isCompleted && this._refs.scanningPauseButton) {
        const controlsContainer = scanningProgress.querySelector('.floating-panel__progress-controls');
        if (controlsContainer && this._refs.scanningPauseButton.parentNode === controlsContainer) {
          controlsContainer.removeChild(this._refs.scanningPauseButton);
          this._refs.scanningPauseButton = null;
        }
      }
      body.appendChild(scanningProgress);
    }

    // Unfollowing Progress
    if (isUnfollowing) {
      const unfollowingProgress = this._createUnfollowingProgress(unfollowingState?.percentage || 0);
      this._refs.unfollowingProgress = unfollowingProgress;
      body.appendChild(unfollowingProgress);
    }

    // Users Found
    if (resultsCount > 0) {
      const usersFoundStat = createElement('div', { className: 'floating-panel__stat' },
        createElement('span', { className: 'floating-panel__stat-label' }, this._t('floatingPanel.usersFound')),
        createElement('span', { className: 'floating-panel__stat-value' }, resultsCount)
      );
      this._refs.usersFoundStat = usersFoundStat;
      this._refs.usersFoundValue = usersFoundStat.querySelector('.floating-panel__stat-value');
      body.appendChild(usersFoundStat);
    }

    // Users Selected
    if (selectedResultsCount > 0) {
      const usersSelectedStat = createElement('div', { className: 'floating-panel__stat' },
        createElement('span', { className: 'floating-panel__stat-label' }, this._t('floatingPanel.usersSelected')),
        createElement('span', { className: 'floating-panel__stat-value' }, selectedResultsCount)
      );
      this._refs.usersSelectedStat = usersSelectedStat;
      this._refs.usersSelectedValue = usersSelectedStat.querySelector('.floating-panel__stat-value');
      body.appendChild(usersSelectedStat);
    }

    // Copy List Button
    if (!isInitial && resultsCount > 0) {
      const copyListButton = createElement('button', {
        className: 'floating-panel__button floating-panel__button--secondary',
        onClick: onCopyList,
        disabled: resultsCount === 0
      }, this._t('floatingPanel.copyList'));
      this._refs.copyListButton = copyListButton;
      body.appendChild(copyListButton);
    }

    // No Users Found
    if (isInitial && resultsCount === 0) {
      const emptyMessage = createElement('div', { className: 'floating-panel__empty' },
        this._t('floatingPanel.noUsersFound')
      );
      this._refs.emptyMessage = emptyMessage;
      body.appendChild(emptyMessage);
    }

    return body;
  }

  /**
   * Create scanning progress element
   * @private
   */
  _createScanningProgress(percentage) {
    const progressPercentage = createElement('span', { className: 'floating-panel__progress-percentage' },
      this._t('floatingPanel.percentage', { percentage })
    );
    this._refs.scanningPercentage = progressPercentage;

    const progressBar = createElement('progress', {
      className: 'floating-panel__progress-bar',
      value: percentage,
      max: '100',
      ariaLabel: this._t('floatingPanel.percentage', { percentage })
    });
    this._refs.scanningProgressBar = progressBar;

    const {
      onPauseScanning,
      onResumeScanning,
      isScanningPaused = false
    } = this.props;

    // Only create pause button if callbacks are provided
    let pauseButton = null;
    if (onPauseScanning && onResumeScanning) {
      pauseButton = createElement('button', {
        className: 'floating-panel__pause-button',
        onClick: isScanningPaused ? onResumeScanning : onPauseScanning,
        title: isScanningPaused ? this._t('floatingPanel.resume') : this._t('floatingPanel.pause')
      }, isScanningPaused ? '▶' : '⏸');
      this._refs.scanningPauseButton = pauseButton;
    }

    const controlsContainer = createElement('div', { className: 'floating-panel__progress-controls' });
    controlsContainer.appendChild(progressPercentage);
    if (pauseButton) {
      controlsContainer.appendChild(pauseButton);
    }

    return createElement('div', { className: 'floating-panel__progress' },
      createElement('div', { className: 'floating-panel__progress-header' },
        createElement('span', { className: 'floating-panel__progress-label' }, this._t('floatingPanel.scanning')),
        controlsContainer
      ),
      progressBar
    );
  }

  /**
   * Create unfollowing progress element
   * @private
   */
  _createUnfollowingProgress(percentage) {
    const progressPercentage = createElement('span', { className: 'floating-panel__progress-percentage' },
      this._t('floatingPanel.percentage', { percentage })
    );
    this._refs.unfollowingPercentage = progressPercentage;

    const progressBar = createElement('progress', {
      className: 'floating-panel__progress-bar',
      value: percentage,
      max: '100',
      ariaLabel: this._t('floatingPanel.percentage', { percentage })
    });
    this._refs.unfollowingProgressBar = progressBar;

    const {
      onPauseUnfollowing,
      onResumeUnfollowing,
      isUnfollowingPaused = false
    } = this.props;

    const pauseButton = createElement('button', {
      className: 'floating-panel__pause-button',
      onClick: isUnfollowingPaused ? onResumeUnfollowing : onPauseUnfollowing,
      title: isUnfollowingPaused ? this._t('floatingPanel.resume') : this._t('floatingPanel.pause')
    }, isUnfollowingPaused ? '▶' : '⏸');
    this._refs.unfollowingPauseButton = pauseButton;

    return createElement('div', { className: 'floating-panel__progress' },
      createElement('div', { className: 'floating-panel__progress-header' },
        createElement('span', { className: 'floating-panel__progress-label' }, this._t('floatingPanel.unfollowing')),
        createElement('div', { className: 'floating-panel__progress-controls' },
          progressPercentage,
          pauseButton
        )
      ),
      progressBar
    );
  }

  /**
   * Update existing elements incrementally
   * @private
   */
  _updateExisting(badgeCount, isExpanded, isScanning, isPaused, isCompleted, isUnfollowing, isInitial,
    percentage, resultsCount, selectedResultsCount, extensionEnabled,
    unfollowingState, onStartScan, onCopyList) {
    // Update badge
    const toggleButton = this.element.querySelector('.floating-panel__toggle');
    if (toggleButton) {
      if (badgeCount > 0) {
        if (this._refs.badge) {
          this._updateText(this._refs.badge, badgeCount);
        } else {
          const badge = createElement('span', { className: 'floating-panel__badge' }, badgeCount);
          this._refs.badge = badge;
          toggleButton.appendChild(badge);
        }
      } else if (this._refs.badge && this._refs.badge.parentNode) {
        this._refs.badge.parentNode.removeChild(this._refs.badge);
        this._refs.badge = null;
      }

      // Update status badge
      if (!extensionEnabled) {
        if (!this._refs.statusBadge) {
          const statusBadge = createElement('span', {
            className: 'floating-panel__status-badge floating-panel__status-badge--disabled',
            title: this._t('floatingPanel.extensionDisabled')
          }, '⚠');
          this._refs.statusBadge = statusBadge;
          toggleButton.appendChild(statusBadge);
        }
      } else if (this._refs.statusBadge && this._refs.statusBadge.parentNode) {
        this._refs.statusBadge.parentNode.removeChild(this._refs.statusBadge);
        this._refs.statusBadge = null;
      }
    }

    // Update content visibility
    if (isExpanded) {
      if (!this._refs.content) {
        const content = this._createContent(isScanning, isPaused, isCompleted, isUnfollowing, isInitial, percentage,
          resultsCount, selectedResultsCount, extensionEnabled,
          unfollowingState, onStartScan, onCopyList);
        this._refs.content = content;
        this.element.appendChild(content);
      } else {
        // Update content incrementally
        this._updateContent(isScanning, isPaused, isCompleted, isUnfollowing, isInitial, percentage,
          resultsCount, selectedResultsCount, extensionEnabled,
          unfollowingState, onStartScan, onCopyList);
      }
    } else {
      // Remove content if collapsed
      if (this._refs.content && this._refs.content.parentNode) {
        this._refs.content.parentNode.removeChild(this._refs.content);
        this._refs.content = null;
        // Clear all content refs
        Object.keys(this._refs).forEach(key => {
          if (key !== 'badge' && key !== 'statusBadge') {
            this._refs[key] = null;
          }
        });
      }
    }
  }

  /**
   * Update content incrementally
   * @private
   */
  _updateContent(isScanning, isPaused, isCompleted, isUnfollowing, isInitial, percentage, resultsCount,
    selectedResultsCount, extensionEnabled, unfollowingState, onStartScan, onCopyList) {
    if (!this._refs.content) return;

    const body = this._refs.content.querySelector('.floating-panel__body');
    if (!body) return;

    // Update status indicator
    if (this._refs.statusIndicator) {
      this._refs.statusIndicator.className = `floating-panel__status-indicator ${extensionEnabled ? 'floating-panel__status-indicator--enabled' : 'floating-panel__status-indicator--disabled'}`;
      this._updateText(this._refs.statusIndicator, extensionEnabled ? '●' : '○');
    }

    // Update status text
    if (this._refs.statusText) {
      this._updateText(this._refs.statusText, extensionEnabled ? this._t('floatingPanel.extensionEnabled') : this._t('floatingPanel.extensionDisabled'));
    }

    // Update start scan button
    if (isInitial && extensionEnabled) {
      if (!this._refs.startScanButton) {
        const startScanButton = createElement('button', {
          className: 'floating-panel__button floating-panel__button--primary',
          onClick: onStartScan
        }, this._t('floatingPanel.startScan'));
        this._refs.startScanButton = startScanButton;
        const statusDiv = body.querySelector('.floating-panel__status');
        if (statusDiv && statusDiv.nextSibling) {
          body.insertBefore(startScanButton, statusDiv.nextSibling);
        } else {
          body.appendChild(startScanButton);
        }
      }
    } else if (this._refs.startScanButton && this._refs.startScanButton.parentNode) {
      this._refs.startScanButton.parentNode.removeChild(this._refs.startScanButton);
      this._refs.startScanButton = null;
    }

    // Update scanning progress (show for scanning, paused, or completed)
    if (isScanning || isPaused || isCompleted) {
      if (this._refs.scanningProgress) {
        // Update existing progress
        if (this._refs.scanningPercentage) {
          this._updateText(this._refs.scanningPercentage, this._t('floatingPanel.percentage', { percentage }));
        }
        if (this._refs.scanningProgressBar) {
          this._refs.scanningProgressBar.value = percentage;
          this._refs.scanningProgressBar.setAttribute('aria-label', this._t('floatingPanel.percentage', { percentage }));
        }
        // Update pause button (only show if scanning or paused, not completed)
        if (this._refs.scanningPauseButton) {
          if (isCompleted) {
            // Hide pause button when completed
            if (this._refs.scanningPauseButton.parentNode) {
              this._refs.scanningPauseButton.parentNode.removeChild(this._refs.scanningPauseButton);
              this._refs.scanningPauseButton = null;
            }
          } else {
            const { onPauseScanning, onResumeScanning, isScanningPaused = false } = this.props;
            this._refs.scanningPauseButton.onclick = (isScanningPaused || isPaused) ? onResumeScanning : onPauseScanning;
            this._refs.scanningPauseButton.title = (isScanningPaused || isPaused) ? this._t('floatingPanel.resume') : this._t('floatingPanel.pause');
            this._updateText(this._refs.scanningPauseButton, (isScanningPaused || isPaused) ? '▶' : '⏸');
          }
        }
      } else {
        // Create new progress
        const scanningProgress = this._createScanningProgress(percentage);
        this._refs.scanningProgress = scanningProgress;
        // Hide pause button if completed
        if (isCompleted && this._refs.scanningPauseButton) {
          const controlsContainer = scanningProgress.querySelector('.floating-panel__progress-controls');
          if (controlsContainer && this._refs.scanningPauseButton.parentNode === controlsContainer) {
            controlsContainer.removeChild(this._refs.scanningPauseButton);
            this._refs.scanningPauseButton = null;
          }
        }
        const insertAfter = this._refs.startScanButton || body.querySelector('.floating-panel__status');
        if (insertAfter && insertAfter.nextSibling) {
          body.insertBefore(scanningProgress, insertAfter.nextSibling);
        } else {
          body.appendChild(scanningProgress);
        }
      }
    } else if (this._refs.scanningProgress && this._refs.scanningProgress.parentNode) {
      this._refs.scanningProgress.parentNode.removeChild(this._refs.scanningProgress);
      this._refs.scanningProgress = null;
      this._refs.scanningPercentage = null;
      this._refs.scanningProgressBar = null;
      this._refs.scanningPauseButton = null;
    }

    // Update unfollowing progress
    const unfollowingPercentage = unfollowingState?.percentage || 0;
    if (isUnfollowing) {
      if (this._refs.unfollowingProgress) {
        // Update existing progress
        if (this._refs.unfollowingPercentage) {
          this._updateText(this._refs.unfollowingPercentage, this._t('floatingPanel.percentage', { percentage: unfollowingPercentage }));
        }
        if (this._refs.unfollowingProgressBar) {
          this._refs.unfollowingProgressBar.value = unfollowingPercentage;
          this._refs.unfollowingProgressBar.setAttribute('aria-label', this._t('floatingPanel.percentage', { percentage: unfollowingPercentage }));
        }
        // Update pause button
        if (this._refs.unfollowingPauseButton) {
          const { onPauseUnfollowing, onResumeUnfollowing, isUnfollowingPaused = false } = this.props;
          this._refs.unfollowingPauseButton.onclick = isUnfollowingPaused ? onResumeUnfollowing : onPauseUnfollowing;
          this._refs.unfollowingPauseButton.title = isUnfollowingPaused ? this._t('floatingPanel.resume') : this._t('floatingPanel.pause');
          this._updateText(this._refs.unfollowingPauseButton, isUnfollowingPaused ? '▶' : '⏸');
        }
      } else {
        // Create new progress
        const unfollowingProgress = this._createUnfollowingProgress(unfollowingPercentage);
        this._refs.unfollowingProgress = unfollowingProgress;
        const insertAfter = this._refs.scanningProgress || this._refs.startScanButton || body.querySelector('.floating-panel__status');
        if (insertAfter && insertAfter.nextSibling) {
          body.insertBefore(unfollowingProgress, insertAfter.nextSibling);
        } else {
          body.appendChild(unfollowingProgress);
        }
      }
    } else if (this._refs.unfollowingProgress && this._refs.unfollowingProgress.parentNode) {
      this._refs.unfollowingProgress.parentNode.removeChild(this._refs.unfollowingProgress);
      this._refs.unfollowingProgress = null;
      this._refs.unfollowingPercentage = null;
      this._refs.unfollowingProgressBar = null;
      this._refs.unfollowingPauseButton = null;
    }

    // Update users found stat
    if (resultsCount > 0) {
      if (this._refs.usersFoundStat) {
        if (this._refs.usersFoundValue) {
          this._updateText(this._refs.usersFoundValue, resultsCount);
        }
      } else {
        const usersFoundStat = createElement('div', { className: 'floating-panel__stat' },
          createElement('span', { className: 'floating-panel__stat-label' }, this._t('floatingPanel.usersFound')),
          createElement('span', { className: 'floating-panel__stat-value' }, resultsCount)
        );
        this._refs.usersFoundStat = usersFoundStat;
        this._refs.usersFoundValue = usersFoundStat.querySelector('.floating-panel__stat-value');
        body.appendChild(usersFoundStat);
      }
    } else if (this._refs.usersFoundStat && this._refs.usersFoundStat.parentNode) {
      this._refs.usersFoundStat.parentNode.removeChild(this._refs.usersFoundStat);
      this._refs.usersFoundStat = null;
      this._refs.usersFoundValue = null;
    }

    // Update users selected stat
    if (selectedResultsCount > 0) {
      if (this._refs.usersSelectedStat) {
        if (this._refs.usersSelectedValue) {
          this._updateText(this._refs.usersSelectedValue, selectedResultsCount);
        }
      } else {
        const usersSelectedStat = createElement('div', { className: 'floating-panel__stat' },
          createElement('span', { className: 'floating-panel__stat-label' }, this._t('floatingPanel.usersSelected')),
          createElement('span', { className: 'floating-panel__stat-value' }, selectedResultsCount)
        );
        this._refs.usersSelectedStat = usersSelectedStat;
        this._refs.usersSelectedValue = usersSelectedStat.querySelector('.floating-panel__stat-value');
        body.appendChild(usersSelectedStat);
      }
    } else if (this._refs.usersSelectedStat && this._refs.usersSelectedStat.parentNode) {
      this._refs.usersSelectedStat.parentNode.removeChild(this._refs.usersSelectedStat);
      this._refs.usersSelectedStat = null;
      this._refs.usersSelectedValue = null;
    }

    // Update copy list button (only when paused or completed)
    if ((isPaused || isCompleted) && resultsCount > 0) {
      if (!this._refs.copyListButton) {
        const copyListButton = createElement('button', {
          className: 'floating-panel__button floating-panel__button--secondary',
          onClick: onCopyList,
          disabled: resultsCount === 0
        }, this._t('floatingPanel.copyList'));
        this._refs.copyListButton = copyListButton;
        body.appendChild(copyListButton);
      } else {
        this._refs.copyListButton.disabled = resultsCount === 0;
      }
    } else if (this._refs.copyListButton && this._refs.copyListButton.parentNode) {
      this._refs.copyListButton.parentNode.removeChild(this._refs.copyListButton);
      this._refs.copyListButton = null;
    }

    // Update empty message
    if (isInitial && resultsCount === 0) {
      if (!this._refs.emptyMessage) {
        const emptyMessage = createElement('div', { className: 'floating-panel__empty' },
          this._t('floatingPanel.noUsersFound')
        );
        this._refs.emptyMessage = emptyMessage;
        body.appendChild(emptyMessage);
      }
    } else if (this._refs.emptyMessage && this._refs.emptyMessage.parentNode) {
      this._refs.emptyMessage.parentNode.removeChild(this._refs.emptyMessage);
      this._refs.emptyMessage = null;
    }
  }

  /**
   * Update component props and re-render
   * @param {Object} newProps - New props
   */
  update(newProps) {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  /**
   * Remove component from DOM
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    // Clear all refs
    Object.keys(this._refs).forEach(key => {
      this._refs[key] = null;
    });
  }
}
