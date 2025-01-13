import React from 'react';
import { Typography } from 'antd';
import { isString } from 'lodash';
import styled from 'styled-components';

const { Text: AntText } = Typography;
const StyledText = styled(AntText)`
    font-size: ${props => props.size ? `${props.size}px` : 'inherit'};
    font-weight: ${props => props.weight || 'inherit'};
    line-height: ${props => props.$lineHeight || 'inherit'};
    color: ${props => props.color || 'inherit'};
    font-feature-settings: 'clig' off, 'liga' off;
    ${props => props.$nowrap && `white-space: nowrap;`}
    ${props => props.$weight && `font-weight: ${props.$weight}`}
    ${props => props.$ellipsis && `
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        // max-width: 135px;
    `}
    ${props => props.$align && `text-align: ${props.$align};`}
    ${props => props.$sticky && `position: sticky;`}

    mark {
        background: transparent;
        color: var(--Primary-500, #297FFF);
    }
`;

const Text = ({ align, children, highlightText, ellipsis, nowrap, sticky, lineHeight, ...rest }) => {
    const text = highlightText ? children.split(highlightText) : [children];

    return (
        <StyledText $ellipsis={ellipsis} $nowrap={nowrap} $align={align} $sticky={sticky} $lineHeight={lineHeight} {...rest}>
            {text.map((t, i) => (
                <React.Fragment key={i}>
                    {(!(nowrap || ellipsis) && isString(t)) ? t.split('\n').map((line, j) => (
                        <React.Fragment key={j}>
                            {j > 0 && <br />}
                            {line}
                        </React.Fragment>
                    )) : t}
                    {highlightText && i < text.length - 1 && <mark>{highlightText}</mark>}
                </React.Fragment>
            ))}
        </StyledText>
    );
};

export default Text;