import React from 'react';
import PropTypes from 'prop-types';
import memoize from 'lodash/memoize';
import dayjs from 'dayjs';
import { Redraw } from './Redraw';
import { difference, formatHtmlDatetime } from './utils';

const RENDER_EVERY = 1000;

const formatUnit = v => String(v).padStart(2, '0');

const formats = {
  yMdhms: 'yMdhms',
  yMdhm: 'yMdhm',
  yMdh: 'yMdh',
  yMd: 'yMd',
  yM: 'yM',
  Mdhms: 'Mdhms',
  Mdhm: 'Mdhm',
  Mdh: 'Mdh',
  Md: 'Md',
  dhms: 'dhms',
  dhm: 'dhm',
  hms: 'hms',
  hm: 'hm',
  ms: 'ms',
  m: 'm',
  s: 's',
};

const unitNames = {
  y: 'years',
  M: 'months',
  d: 'days',
  h: 'hours',
  m: 'minutes',
  s: 'seconds',
};

const getFormat = memoize(format =>
  ['y', 'M', 'd', 'h', 'm', 's'].reduce(
    (units, symbol) => (formats[format].includes(symbol) ? [...units, unitNames[symbol]] : units),
    [],
  ),
);

function getTime(start, end, format, showEmpty, maxUnits) {
  const date1 = end || new Date();
  const date2 = end ? new Date() : start;

  const totalInSeconds = dayjs(date1).diff(date2, 'seconds');

  const { years, months, days, hours, minutes, seconds } = difference(date1, date2, {
    keepLeadingZeros: showEmpty,
    maxUnits,
    units: getFormat(format),
  });

  return {
    units: [
      ['Y', years],
      ['M', months],
      ['D', days],
      ['H', hours],
      ['M', minutes],
      ['S', seconds],
    ],
    totalInSeconds,
  };
}

class Timer extends React.Component {
  static propTypes = {
    end: PropTypes.instanceOf(Date),
    format: PropTypes.oneOf(Object.keys(formats)),
    maxUnits: PropTypes.number,
    showEmpty: PropTypes.bool,
    showIcon: PropTypes.bool,
    start: PropTypes.instanceOf(Date),
    theme: PropTypes.object,
  };
  static defaultProps = {
    format: formats.yMdhms,
    maxUnits: -1,
    showEmpty: false,
    showIcon: true,
  };

  render() {
    const { end, start } = this.props;
    return (
      <time
        dateTime={formatHtmlDatetime(end || start)}
        css={`
          display: flex;
          align-items: center;
          white-space: nowrap;
        `}
      >
        <Redraw interval={RENDER_EVERY}>{this.renderTime}</Redraw>
      </time>
    );
  }

  renderTime = () => {
    const { start, end, format, showEmpty, maxUnits } = this.props;

    const { totalInSeconds, units } = getTime(start, end, format, showEmpty, maxUnits);

    if (totalInSeconds < 0 || Object.is(totalInSeconds, -0)) {
      return <span>{end ? 'Time out' : '−'}</span>;
    }

    const lastUnitIndex = units.reduce((lastIndex, unit, index) => (unit[1] === null ? lastIndex : index), 0);

    let shownUnits = 0

    return (
      <span>
        {units.map((unit, index) => {
          if (shownUnits === 2) {
            return null;
          }
          const isLast = index === lastUnitIndex;
          const isSeconds = index === units.length - 1;

          // Only time units (hours, minutes and seconds).
          // Remember to update if ms gets added one day!
          const isTimeUnit = index >= units.length - 3;

          if (unit[1] === null) {
            return null;
          }

          shownUnits += 1;

          return (
            <React.Fragment key={index}>
              <span
                css={`
                  color: #828282;
                  ${isSeconds &&
                  // Fix the width of the seconds unit so that
                  // it doesn’t jump too much.
                  `   display: inline-flex;
                      align-items: baseline;
                      justify-content: space-between;
                      min-width: 31px;
                    `};
                `}
              >
                {formatUnit(unit[1])}
                <span
                  css={`
                    margin-left: 2px;
                    color: #828282;
                  `}
                >
                  {unit[0]}
                </span>
              </span>
              {!isLast && shownUnits !== 2 && (
                // Separator
                <span
                  css={`
                    margin: 0 4px;
                    color: #828282;
                    font-weight: 400;
                  `}
                >
                  {isTimeUnit && ':'}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </span>
    );
  };
}

export default props => {
  return <Timer {...props} />;
};
